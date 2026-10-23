# HireMinds product plan

HireMinds is a hiring friend for Indian students. It stays with one person from an empty profile to an offer: get the proof in one place, make the resume match a real job, practice the interview out loud, and show what to fix next.

The score in phase 1 is computed in code. The same resume always produces the same numbers. Later phases add profile links, a job description, and interview practice. They do not replace this score with a model’s opinion.

## What the student can do when this is finished

1. Build one profile. Upload a resume. Connect GitHub, Codeforces, and the other public student profiles they actually use. Add a LinkedIn URL they confirm themselves.
2. Paste a job description. See which required words are missing, which project already proves those words, and a rewritten resume. Save that as a new version and score it again.
3. Practice that same job out loud. A voice asks questions from the job description and the resume. The student answers on camera.
4. Get delivery practice: pace, filler words, answer length, and whether they faced the camera. Expression hints are optional, consented, and never a hire or reject score.
5. Follow a weekly plan that uses the resume score, the job-description match, and the interview results.

## How the scores work

Companies’ applicant tracking systems mostly check whether a file can be read and whether the words from one job description appear. They do not publish a universal quality score. HireMinds does not claim to reproduce one.

The Resume page has two independent scores. Rubric `h02-v1` in `server/config/ats.config.js` is the only definition. The older single job-match mix (required 35, experience 20, projects 20, preferred 15, education and readability 10) is retired.

**Document compatibility (0–100).** Can the parser read the file? It does not use the job description.

- Text extraction and reading order, 30%.
- Section identification, 20%.
- Contact field parsing, 15%.
- Education, experience and date parsing, 15%.
- Layout and formatting that the text actually shows, 20%. Columns, fonts and margins are not measured.

`A = 100 × sum(weight × normalized component) / sum(weights of components that could be observed).` If extraction fails, the result is an error or inconclusive. It is not stored as zero.

**Job match (0–100).** This is the only match score, and the only score the practice gate uses. Initial weights:

- Required technical skills, 30%.
- Relevant projects and experience, 25%.
- Role responsibilities, 20%.
- Education and eligibility, 10%.
- Preferred keywords, 10%.
- Soft skills, 5%.

A skill counts once. A bullet that uses it scores 100, a bare name in Projects or Experience scores 70, a skills-list mention scores 60, and any other mention scores 40. The strongest line wins. Repeating the name does not raise the credit. Responsibility points use the words left after skill names are removed, so the same skill is not added again. A category with nothing to assess is left out and the remaining weights are renormalized.

Reported beside the scores, and not added into them:

- Keyword coverage: each requirement once.
- Mandatory eligibility: confirmed meets, confirmed unmet, and unverified. Unverified is unknown, not a failure. A confirmed miss blocks the gate.
- Evidence confidence: the share of assessed rows that have a located snippet.
- Semantic matching: off. No local model is configured, and no external API is called.

The practice gate opens at a configurable job-match threshold, initially 75, only when parsing succeeded, the assessment is the current one for that user, and no confirmed eligibility condition is unmet.

**HireMinds level score (0–100).** This is a separate coaching number for a resume with no job description. It is not the job match and it is not document compatibility. Experience is not counted for a fresher.

- Fresher: projects 40%, skills 30%, education 20%, certifications 10%, experience 0%.
- Intermediate: experience 30%, skills 30%, projects 25%, education 10%, certifications 5%.
- Experienced: experience 40%, skills 30%, projects 15%, education 10%, certifications 5%.

Onboarding values `junior`, `mid`, and `senior` map to intermediate, experienced, and experienced.

Every point is a check with earned points, max points, and a sentence. The section score is earned divided by max for that section. The level score is the weighted sum of the five section scores. Run the same text twice and both numbers stay the same.

A scanned or image PDF fails before scoring, because a company parser would not read it either.

Online checkers use private rubrics. Expect document compatibility to flag the same kinds of problems (no phone, no headings, unreadable text). Do not expect the integer to be identical. The job match will not match a checker that blends readability and keywords into one number.

## Phase 1 — Real ATS score

The Resume page now scores a pasted job description. Rubric `h02-v1`.

Ships:

- Document compatibility in `server/services/ats/compatibility.js`.
- Job match in `server/services/ats/engine.js`. The level score in `server/services/ats.rules.js` stays a separate coaching number.
- PDF and DOCX text are extracted locally. Gemini does not choose either number.
- The Resume page shows both scores, the category bars, eligibility, keyword coverage and evidence confidence.
- The practice gate is enforced by `POST /ats/advance`. A score sent by the browser is ignored.

Done when:

- The same resume scores the same on two runs.
- The level score equals the weighted sum shown on the page.
- A fresher resume with strong projects and no job scores higher on the level score than the same text scored as experienced.
- Removing the email lowers compatibility.
- A PDF with no extractable text is rejected.
- You can upload your resume here and on an online checker and reconcile the gap from the checklist.

Not in this phase: job-description match, profile links, voice, video, facial analysis, editing the resume, payments.

## Phase 2 — One student profile

The profile is the source of proof for every later score.

- Resume upload stays the base document.
- GitHub: public API from a username or OAuth. Pull repos, languages, and the ones worth turning into resume projects.
- Codeforces: public API from a handle. Rating, contests, and problems solved become a project or achievement line only when the student confirms.
- Next public profiles, in this order: LeetCode, CodeChef, a portfolio URL. Each one is a confirmed import, not a silent scrape.
- LinkedIn: a URL the student types and confirms. HireMinds does not scrape LinkedIn. Official LinkedIn access is not available to a normal app, and scraping breaks their terms.
- The profile page shows what was imported, when, and which resume bullets came from it.

Done when a student can connect GitHub and Codeforces, see the imported proof, and accept or reject each suggested resume line.

## Phase 3 — Job description desk

One pasted job description drives the resume and, later, the interview.

- Count required terms from that job description against the resume and the imported profile. This count is in code. The model may phrase the advice. It does not invent the match percentage.
- Show matched words, missing words, and the match percentage.
- Recommend an existing project, including one sitting on GitHub or Codeforces, when it already proves a missing word.
- Rewrite the bullets for that job. Save a new resume version. Run phase 1 scoring again on the new version, plus the job-description match.
- The interview in phase 4 reads this same job description and this resume version.

Done when you can paste a job description, see a match percentage you can recheck by counting words, accept a project suggestion, save a new version, and see both scores move for a stated reason.

## Phase 4 — Voice and video mock

Practice for the job in phase 3, or for a role if no job description is pasted yet.

- The student picks a round: technical, HR, behavioral (STAR), or a placement-drive format already sketched in the app (TCS NQT, InfyTQ, AMCAT, Wipro NLTH, Cognizant GenC).
- Questions are built from the resume and, when present, the job description.
- A voice asks the question. The student answers on camera, out loud.
- The answer is scored on content: correctness, structure, what was missing, and a better version.
- Session history keeps the scores.

Done when a student can finish one spoken round about their own resume and see a content score with the reason for each deduction.

## Phase 5 — Delivery coaching

This trains how the answer was delivered. It is practice for the student, not a verdict a company would make. No real ATS reads a face.

- Pace, filler words (“um”, “like”, “basically”), answer length, and whether the face stayed in frame.
- Optional expression hints (flat, tense, looking away) only after a separate consent switch. Show the clip next to the hint so the student can judge it.
- These hints never change the ATS score, the job-description match, or a hire/reject label. Face models are unreliable across lighting, skin tone, and how different people show nerves.
- Drills come out of the session: slow down, answer in STAR, look at the camera on the second question.

Done when a consented session shows content feedback and delivery feedback as two separate blocks, and declining expression analysis still runs the rest of the interview.

## Phase 6 — Weekly trainer

One plan that reads the three real inputs: latest level score and its failed checks, latest job-description gaps, and the last interview’s weak answers.

- Setup is target role, companies, and a placement date.
- Each week has 3 to 5 tasks that name the check or the question they come from.
- Readiness is a composite shown with its formula: ATS 30%, interview average 40%, skill gap 20%, goal completion 10%.
- A Sunday job writes the next week from what was actually finished.

Done when the week’s tasks change because a resume check was fixed or an interview answer improved, and the readiness number matches the formula on screen.

## Phase 7 — Business layer, after the loop works

Free and Pro quotas, Razorpay, and the campus TPO view already exist in rough form. Harden them only after phases 1–6 are real: a free student can finish one analysis and one interview, a Pro student is not capped, and a TPO sees aggregate readiness that uses the same formulas as the student view.

## What we will not pretend

- The compatibility number is not Jobscan’s match rate. Jobscan needs a job description. That arrives in phase 3.
- The level score is supposed to disagree with tools that punish a fresher for having no job.
- Facial analysis will not decide whether someone is hireable.
- LinkedIn will not be scraped.
