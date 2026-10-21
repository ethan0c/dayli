import { describe, expect, it } from 'vitest';
import { assessment, iconFor } from '../src';

describe('assessment', () => {
  it('tells exams from quizzes', () => {
    expect(assessment('Midterm 1')).toBe('exam');
    expect(assessment('BIO 101 final')).toBe('exam');
    expect(assessment('Final exam')).toBe('exam');
    expect(assessment('Quiz 3')).toBe('quiz');
    expect(assessment('Unit test: ch. 4')).toBe('quiz');
  });

  it('leaves things that only share a word alone', () => {
    expect(assessment('Final project')).toBeNull();
    expect(assessment('Final paper due')).toBeNull();
    expect(assessment('Midterm review session')).toBeNull();
    expect(assessment('Practice quiz')).toBeNull();
    expect(assessment('Robotics contest')).toBeNull();
    expect(assessment('Finalize budget')).toBeNull();
  });

  it('gives the import the same answer', () => {
    expect(iconFor({ kind: 'task', category: 'school', title: 'Final project', is_deadline: true })).not.toBe('exam');
    expect(iconFor({ kind: 'event', category: 'school', title: 'Quiz 2', is_deadline: true })).toBe('exam');
  });
});
