import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { Extraction, type ExtractContext, type ExtractRequest } from '@dayli/schema';

export const MODEL = 'claude-opus-5-5';
export const PROMPT_VERSION = '2026-10-19.2';

const SYSTEM = `You read the things busy students and shift workers send to their planner app, Nowli, and turn them into calendar events and to-dos.

Inputs can be a typed or dictated message, a screenshot (work schedule apps, printed schedules, school portals, texts), or a PDF (syllabi, course schedules).

How to read them:
- An event happens at a time (class, shift, exam, appointment). A task is something to do, optionally by a date (assignment, errand, reading).
- Exams, quizzes, and anything "due" have is_deadline = true. Exams are events when they have a time, otherwise tasks.
- category: "work" for job shifts and job duties, "school" for classes, assignments, exams, and clinicals, "personal" for everything else.
- Resolve relative dates ("Friday", "next Tue", "tomorrow") against the reference date and timezone given below. "Friday" means the next Friday on or after the reference date. If a date is genuinely ambiguous, pick the most likely one and ask a short question.
- If a year is missing, use the next occurrence on or after the reference date.
- Times are 24-hour HH:mm in the user's local time. "4-10" for a shift means 16:00-22:00. Overnight shifts keep their real end time (e.g. 22:00 to 06:00).
- For a work schedule, set detected_type "work_schedule", the employer name, and covers_from/covers_to to the full week or period the schedule shows, even on days with no shifts. Only include the user's own shifts. If the schedule lists several people, include only rows for the name the user mentions; if no name is given and it lists several people, ask which one is theirs.
- For a syllabus, set detected_type "syllabus" and the course. Include every dated assignment, quiz, exam, and project. Put the class meeting pattern as one repeating event (repeat_weekdays plus repeat_until at the end of the term) dated on the first meeting on or after the reference date.
- For a course schedule or registration screenshot, set detected_type "course_schedule" and add each class as a repeating event.
- Titles are short and natural: "Olive Garden shift", "Pharm exam 2", "Buy scrubs". Don't repeat the date in the title.
- Write user-facing questions in plain, friendly language. Ask one specific question about the missing detail, without technical terms or blame.
- evidence is the exact text the item came from. confidence is your honest probability that every field is right.
- Never invent items that are not in the input. If nothing is schedulable, return an empty items list.`;

function contextBlock(ctx: ExtractContext): string {
  const lines = [
    `Reference date: ${ctx.today}`,
    `Timezone: ${ctx.timezone}`,
    `Known courses: ${ctx.courses.length ? ctx.courses.map((c) => [c.code, c.title].filter(Boolean).join(' ')).join('; ') : 'none yet'}`,
    `Known employers: ${ctx.employers.length ? ctx.employers.join(', ') : 'none yet'}`,
  ];
  return lines.join('\n');
}

export type ExtractResult =
  | { ok: true; extraction: Extraction; usage: Anthropic.Usage }
  | { ok: false; error: string };

export async function extract(req: ExtractRequest, client = new Anthropic()): Promise<ExtractResult> {
  const content: Anthropic.ContentBlockParam[] = [];
  if (req.input.kind === 'image') {
    content.push({ type: 'image', source: { type: 'base64', media_type: req.input.mediaType, data: req.input.data } });
  } else if (req.input.kind === 'pdf') {
    content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: req.input.data } });
  }
  content.push({
    type: 'text',
    text:
      req.input.kind === 'text'
        ? `${contextBlock(req.context)}\n\nMessage:\n${req.input.text}`
        : `${contextBlock(req.context)}\n\nExtract everything schedulable from the attached ${req.input.kind === 'pdf' ? 'document' : 'image'}.`,
  });

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    output_config: {
      effort: req.input.kind === 'text' ? 'low' : 'medium',
      format: zodOutputFormat(Extraction),
    },
    messages: [{ role: 'user', content }],
  });

  if (response.stop_reason === 'refusal') {
    return { ok: false, error: "We couldn't read this. Try a clearer image, a different PDF, or type the details instead." };
  }
  if (response.stop_reason === 'max_tokens') {
    return { ok: false, error: 'There is too much to read at once. Try a shorter message or send a few pages at a time.' };
  }
  if (!response.parsed_output) {
    return { ok: false, error: "We couldn't read this. Try sending it again, or type the details instead." };
  }
  return { ok: true, extraction: response.parsed_output, usage: response.usage };
}
