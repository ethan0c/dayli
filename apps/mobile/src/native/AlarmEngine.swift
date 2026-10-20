import Foundation
import AlarmKit
import SwiftUI

struct SemliAlarmRequest: Codable {
  let id: String
  let title: String
  let fireAt: Double
}

@available(iOS 26.0, *)
private struct SemliAlarmMetadata: AlarmMetadata { let itemID: String }

@available(iOS 26.0, *)
actor AlarmEngine {
  static let shared = AlarmEngine()
  private let storageKey = "semli.urgentAlarms.v1"
  private struct Entry: Codable {
    let alarmID: UUID
    let title: String
    let fireAt: Double
  }

  func status() -> String {
    switch AlarmManager.shared.authorizationState {
    case .authorized: return "authorized"
    case .denied: return "denied"
    case .notDetermined: return "notDetermined"
    @unknown default: return "denied"
    }
  }

  func authorize() async throws -> String {
    if AlarmManager.shared.authorizationState == .notDetermined {
      _ = try await AlarmManager.shared.requestAuthorization()
    }
    return status()
  }

  /// Only our recorded alarm IDs are changed. Past ringing alarms remain until Stop,
  /// or until their item is completed, deleted, or no longer urgent.
  func synchronize(_ requests: [SemliAlarmRequest]) async throws -> [String] {
    guard status() == "authorized" else { return [] }
    let saved = UserDefaults.standard.data(forKey: storageKey)
    var entries = (saved.flatMap { try? JSONDecoder().decode([String: Entry].self, from: $0) }) ?? [:]
    let now = Date().timeIntervalSince1970
    let future = requests.filter { $0.fireAt > now }.sorted { $0.fireAt < $1.fireAt }.prefix(32)
    let validIDs = Set(requests.map(\.id))
    let desiredIDs = Set(future.map(\.id))
    let live = try AlarmManager.shared.alarms
    let liveIDs = Set(live.map(\.id))
    let ringing = Set(live.filter { $0.state == .alerting }.map(\.id))

    func persist() throws {
      UserDefaults.standard.set(try JSONEncoder().encode(entries), forKey: storageKey)
    }

    for (key, entry) in entries {
      let unchanged = requests.contains { $0.id == key && $0.title == entry.title && $0.fireAt == entry.fireAt }
      let keep = validIDs.contains(key) && (desiredIDs.contains(key) || (unchanged && ringing.contains(entry.alarmID)))
      if !keep {
        if liveIDs.contains(entry.alarmID) { try AlarmManager.shared.cancel(id: entry.alarmID) }
        entries.removeValue(forKey: key)
        try persist()
      }
    }
    for request in future {
      if let old = entries[request.id], old.title == request.title, old.fireAt == request.fireAt,
         liveIDs.contains(old.alarmID) { continue }
      let alarmID = entries[request.id]?.alarmID ?? UUID()
      if liveIDs.contains(alarmID) { try AlarmManager.shared.cancel(id: alarmID) }
      entries.removeValue(forKey: request.id)
      try persist()
      let alert: AlarmPresentation.Alert
      if #available(iOS 26.1, *) {
        alert = AlarmPresentation.Alert(title: LocalizedStringResource(stringLiteral: request.title))
      } else {
        alert = AlarmPresentation.Alert(title: LocalizedStringResource(stringLiteral: request.title),
          stopButton: AlarmButton(text: "Stop", textColor: .white, systemImageName: "stop.fill"))
      }
      let attributes = AlarmAttributes(presentation: AlarmPresentation(alert: alert),
        metadata: SemliAlarmMetadata(itemID: request.id), tintColor: Color(red: 0.44, green: 0.34, blue: 0.74))
      let configuration = AlarmManager.AlarmConfiguration.alarm(
        schedule: .fixed(Date(timeIntervalSince1970: request.fireAt)), attributes: attributes, sound: .default)
      _ = try await AlarmManager.shared.schedule(id: alarmID, configuration: configuration)
      entries[request.id] = Entry(alarmID: alarmID, title: request.title, fireAt: request.fireAt)
      try persist()
    }
    return Array(entries.keys)
  }
}
