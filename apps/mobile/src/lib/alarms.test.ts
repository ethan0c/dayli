import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  platform: { OS: 'ios' }, state: {} as Record<string, unknown>, requireOptionalNativeModule: vi.fn(),
  getStatusAsync: vi.fn(), requestAuthorizationAsync: vi.fn(), syncAsync: vi.fn(), setSettings: vi.fn(),
}));
vi.mock('expo', () => ({ requireOptionalNativeModule: mocks.requireOptionalNativeModule }));
vi.mock('react-native', () => ({ Platform: mocks.platform }));
vi.mock('../store', () => ({ useStore: { getState: () => ({ ...mocks.state, setSettings: mocks.setSettings }) } }));
const task = { id: 'task', title: 'Assignment', kind: 'task', date: '2026-10-20', start: '13:00', urgent: true, done: false };

beforeEach(async () => {
  vi.resetModules(); vi.resetAllMocks(); mocks.platform.OS = 'ios';
  (await import('./plus-status')).setPlusStatus('active');
  mocks.requireOptionalNativeModule.mockReturnValue(mocks);
  mocks.getStatusAsync.mockResolvedValue('authorized'); mocks.requestAuthorizationAsync.mockResolvedValue('authorized');
  mocks.syncAsync.mockResolvedValue(['task']);
  mocks.state = { items: { task }, settings: { reminders: { urgentAlarmsEnabled: true } } };
  mocks.setSettings.mockImplementation((patch) => { mocks.state.settings = { ...(mocks.state.settings as object), ...patch }; });
});

describe('native ringing alarm access', () => {
  it('schedules through the native alarm module independently of notification permission', async () => {
    const { syncRingingAlarms } = await import('./alarms');
    await syncRingingAlarms();
    expect(JSON.parse(mocks.syncAsync.mock.lastCall?.[0])).toMatchObject([{ id: 'task', title: 'Assignment' }]);
    expect(mocks.requestAuthorizationAsync).not.toHaveBeenCalled();
  });
  it('never asks for permission or schedules automatically before explicit authorization', async () => {
    mocks.getStatusAsync.mockResolvedValue('notDetermined');
    const { syncRingingAlarms } = await import('./alarms'); await syncRingingAlarms();
    expect(mocks.syncAsync).not.toHaveBeenCalled(); expect(mocks.requestAuthorizationAsync).not.toHaveBeenCalled();
  });
  it('only enables the preference after the person grants alarm permission', async () => {
    mocks.requestAuthorizationAsync.mockResolvedValue('denied');
    const { enableRingingAlarms } = await import('./alarms'); await enableRingingAlarms();
    expect(mocks.setSettings).not.toHaveBeenCalled();
    mocks.requestAuthorizationAsync.mockResolvedValue('authorized'); await enableRingingAlarms();
    expect(mocks.setSettings).toHaveBeenCalledWith({ reminders: { urgentAlarmsEnabled: true } });
  });
  it('cancels alarms after global disable, completion, unmarking urgency or deletion', async () => {
    const { syncRingingAlarms, disableRingingAlarms } = await import('./alarms');
    await disableRingingAlarms(); expect(mocks.syncAsync).toHaveBeenLastCalledWith('[]');
    mocks.state.settings = { reminders: { urgentAlarmsEnabled: true } };
    mocks.state.items = { task: { ...task, done: true } }; await syncRingingAlarms();
    expect(mocks.syncAsync).toHaveBeenLastCalledWith('[]');
    mocks.state.items = { task: { ...task, urgent: false } }; await syncRingingAlarms();
    expect(mocks.syncAsync).toHaveBeenLastCalledWith('[]');
    mocks.state.items = {}; await syncRingingAlarms(); expect(mocks.syncAsync).toHaveBeenLastCalledWith('[]');
  });
  it('schedules nothing without Plus, leaves alarms alone until the store answers, and follows a purchase or lapse', async () => {
    const { setPlusStatus } = await import('./plus-status');
    const { syncRingingAlarms, enableRingingAlarms } = await import('./alarms');
    setPlusStatus('unknown'); await syncRingingAlarms(); expect(mocks.syncAsync).not.toHaveBeenCalled();
    setPlusStatus('inactive'); await syncRingingAlarms(); expect(mocks.syncAsync).toHaveBeenLastCalledWith('[]');
    await expect(enableRingingAlarms()).rejects.toThrow('Semli Plus');
    expect(mocks.requestAuthorizationAsync).not.toHaveBeenCalled();
    setPlusStatus('active');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(JSON.parse(mocks.syncAsync.mock.lastCall?.[0])).toMatchObject([{ id: 'task' }]);
    setPlusStatus('inactive');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mocks.syncAsync).toHaveBeenLastCalledWith('[]');
  });
  it('handles old builds and unsupported platforms without manufacturing an alarm', async () => {
    mocks.requireOptionalNativeModule.mockReturnValue(null);
    const { enableRingingAlarms, syncRingingAlarms } = await import('./alarms'); await syncRingingAlarms();
    await expect(enableRingingAlarms()).rejects.toThrow('new iOS development build');
    mocks.platform.OS = 'android'; await syncRingingAlarms(); expect(mocks.syncAsync).not.toHaveBeenCalled();
  });
  it('retries after native scheduling errors instead of permanently skipping the plan', async () => {
    mocks.syncAsync.mockRejectedValueOnce(new Error('Native scheduling failed'));
    const { syncRingingAlarms } = await import('./alarms');
    await expect(syncRingingAlarms()).rejects.toThrow('Native scheduling failed');
    await syncRingingAlarms(); expect(mocks.syncAsync).toHaveBeenCalledTimes(2);
  });
});
