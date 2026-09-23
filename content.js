// Built-in game content. No database, downloads, or external services.
export const DESIGNATIONS = ['Software Engineer', 'Designer', 'HR Representative', 'Team Manager', 'Project Manager', 'Office Coordinator', 'Finance Analyst', 'Marketing Associate', 'Operations Lead', 'Intern'];
export const RANKS = ['Intern', 'Associate', 'Senior Associate', 'Team Lead', 'Department Manager', 'Executive'];
export const DURATIONS = { briefing: 20, work: 90, incident: 10, meeting: 60, vote: 20, appeal: 20, resolution: 10 };
export const ACTIONS = ['Delay the Report', 'Move the File', 'Plant a Misleading Note', 'Take Credit', 'Gossip'];
export const PROMPTS = ['I noticed activity around the project board.', 'A missed task is not proof of sabotage.', 'Let’s compare the evidence before voting.', 'I was working on the shared project.', 'That clue could have been planted.', 'I think we should abstain this round.'];
export const EXPLANATIONS = ['I was fixing the shared file.', 'I was in a meeting.', 'That clue was planted.'];
export const TASKS = [
 { title: 'Sort the Inbox', category: 'Communications', kind: 'order', instruction: 'Arrange these emails from most urgent to least urgent.', options: ['Friday social invitation', 'Customer outage — happening now', 'Report due this afternoon'], answer: [1, 2, 0], icon: 'inbox' },
 { title: 'Review the Pull Request', category: 'Engineering', kind: 'choice', instruction: 'The sign-up form must accept a valid email. Which issue blocks release?', options: ['The button is a different shade of blue.', 'Valid email addresses are rejected.', 'The reviewer prefers another font.'], answer: [1], icon: 'code' },
 { title: 'Prepare the Meeting Room', category: 'Operations', kind: 'order', instruction: 'Put the agenda in order: context first, discussion next, decisions last.', options: ['Agree on next steps', 'Discuss project options', 'Introduce the project'], answer: [2, 1, 0], icon: 'calendar' },
 { title: 'Reconcile Expenses', category: 'Finance', kind: 'choice', instruction: 'Policy: meals up to $25, travel up to $60. Which receipt needs correction?', options: ['Client lunch · $22', 'Train ticket · $48', 'Team lunch · $38'], answer: [2], icon: 'receipt' },
 { title: 'Fix the Slide Deck', category: 'Design', kind: 'order', instruction: 'Tell the story in order: problem, solution, then expected impact.', options: ['Expected results', 'Our proposed solution', 'The customer problem'], answer: [2, 1, 0], icon: 'slides' },
 { title: 'Route the Support Tickets', category: 'Support', kind: 'choice', instruction: 'A customer was charged twice for a subscription. Which department should receive the ticket?', options: ['Design', 'Facilities', 'Finance'], answer: [2], icon: 'route' },
];

TASKS.push(
 { title: 'Audit the Inventory', category: 'Operations', kind: 'choice', instruction: 'We bought 18 keyboards and issued 11. How many should remain?', options: ['5 keyboards', '7 keyboards', '9 keyboards'], answer: [1], icon: 'briefcase' },
 { title: 'Plan the Product Launch', category: 'Marketing', kind: 'order', instruction: 'Arrange the launch: research, build the campaign, then publish.', options: ['Publish the announcement', 'Research the audience', 'Build the campaign'], answer: [1, 2, 0], icon: 'slides' },
 { title: 'Spot the Duplicate Invoice', category: 'Finance', kind: 'choice', instruction: 'The ledger already contains invoice A-204 for $80. Which entry is a duplicate?', options: ['A-205 · $80', 'A-204 · $80', 'A-206 · $40'], answer: [1], icon: 'receipt' },
 { title: 'Onboard a New Colleague', category: 'People', kind: 'order', instruction: 'First create an account, then grant access, then give a project tour.', options: ['Give the project tour', 'Create the account', 'Grant project access'], answer: [1, 2, 0], icon: 'people' },
 { title: 'Check the Release Notes', category: 'Engineering', kind: 'choice', instruction: 'The release fixes search and adds dark mode. Which summary matches?', options: ['New payment system', 'Improved search and dark mode', 'Search has been removed'], answer: [1], icon: 'code' },
 { title: 'Schedule the Client Call', category: 'Communications', kind: 'choice', instruction: 'Alex is free 10–12. Sam is free 11–13. Choose a one-hour shared slot.', options: ['10:00–11:00', '11:00–12:00', '12:00–13:00'], answer: [1], icon: 'calendar' },
 { title: 'Publish the Newsletter', category: 'Marketing', kind: 'order', instruction: 'Draft first, proofread second, get approval third, and send last.', options: ['Send to subscribers', 'Get approval', 'Draft the newsletter', 'Proofread the copy'], answer: [2, 3, 1, 0], icon: 'inbox' },
 { title: 'Check the Project Budget', category: 'Finance', kind: 'choice', instruction: 'The budget is $500. Design costs $180 and research costs $220. What remains?', options: ['$80', '$120', '$100'], answer: [2], icon: 'receipt' },
 { title: 'Prepare the Backup', category: 'Engineering', kind: 'order', instruction: 'Choose the files, create the backup, then verify you can restore it.', options: ['Verify the restore', 'Choose the files', 'Create the backup'], answer: [1, 2, 0], icon: 'shield' },
 { title: 'Find the Broken Link', category: 'Design', kind: 'choice', instruction: 'The help page is /help. Which button sends the reader to the wrong place?', options: ['Help → /help', 'Support → /help', 'Get help → /missing'], answer: [2], icon: 'route' },
 { title: 'Prioritize the Roadmap', category: 'Product', kind: 'order', instruction: 'First unblock checkout, then improve onboarding, then add decorative themes.', options: ['Decorative themes', 'Fix broken checkout', 'Improve onboarding'], answer: [1, 2, 0], icon: 'slides' },
 { title: 'Verify the Timesheet', category: 'People', kind: 'choice', instruction: 'A shift is 09:00–17:00 with a one-hour unpaid break. How many hours are worked?', options: ['6 hours', '7 hours', '8 hours'], answer: [1], icon: 'clock' },
 { title: 'Handle the Service Incident', category: 'Support', kind: 'order', instruction: 'Acknowledge the issue, investigate, fix it, and then confirm recovery.', options: ['Confirm recovery', 'Investigate the cause', 'Acknowledge the issue', 'Apply the fix'], answer: [2, 1, 3, 0], icon: 'shield' },
 { title: 'Choose the Accessible Label', category: 'Design', kind: 'choice', instruction: 'Which button label clearly describes downloading an expense report?', options: ['Click here', 'Download expense report', 'Go'], answer: [1], icon: 'eye' },
 { title: 'Prepare the Delivery', category: 'Operations', kind: 'order', instruction: 'Check the order, pack the items, attach the label, and hand off to the courier.', options: ['Attach the label', 'Hand off to courier', 'Check the order', 'Pack the items'], answer: [2, 3, 0, 1], icon: 'briefcase' },
 { title: 'Check the Survey Results', category: 'Research', kind: 'choice', instruction: 'Of 20 responses, 12 prefer option A, 5 prefer B, and 3 prefer C. Which has a majority?', options: ['Option C', 'Option B', 'Option A'], answer: [2], icon: 'people' },
 { title: 'Organize the Handover', category: 'Operations', kind: 'order', instruction: 'Document the status, list remaining work, then confirm the next owner.', options: ['Confirm the next owner', 'Document the current status', 'List remaining work'], answer: [1, 2, 0], icon: 'route' },
 { title: 'Proofread the Announcement', category: 'Communications', kind: 'choice', instruction: 'The meeting is Tuesday at 14:00 in Room 3. Which announcement is correct?', options: ['Tuesday · 14:00 · Room 3', 'Thursday · 14:00 · Room 3', 'Tuesday · 16:00 · Room 2'], answer: [0], icon: 'inbox' }
);

ACTIONS.push('Flood the Inbox', 'Book a Ghost Meeting', 'Scramble the Forecast');
PROMPTS.push('Let’s look at the shared workstation group.', 'The office event explains some of today’s progress.', 'Completing tasks does not prove someone is innocent.', 'An appeal should be judged fairly.', 'We need a majority, not just a hunch.', 'I restored the missing project file.');

export const PROJECTS = [
 { title: 'The quarterly launch', description: 'Prepare the launch materials and get the team ready for release.', icon: 'slides' },
 { title: 'The client pitch', description: 'Build a convincing proposal before the client reaches the meeting room.', icon: 'briefcase' },
 { title: 'The annual audit', description: 'Reconcile the records, tidy the invoices, and keep the paper trail intact.', icon: 'receipt' },
 { title: 'The product rescue', description: 'Fix the customer experience and get an overdue release back on track.', icon: 'code' },
 { title: 'The new-hire welcome', description: 'Prepare accounts, organize the handover, and make a good first impression.', icon: 'people' },
 { title: 'The company offsite', description: 'Coordinate travel, agendas, and announcements without losing the receipts.', icon: 'calendar' }
];
export const OFFICE_EVENTS = [
 { title: 'Business as usual', description: 'Each completed task adds 4% company progress.', taskPoints: 4, deskBonus: 0, restorePoints: 4 },
 { title: 'Focus Friday', description: 'Fewer meetings: each completed task adds 5% company progress.', taskPoints: 5, deskBonus: 0, restorePoints: 4 },
 { title: 'Mentorship day', description: 'Clear all three tasks for an extra 6% company progress.', taskPoints: 4, deskBonus: 6, restorePoints: 4 },
 { title: 'Deadline crunch', description: 'The scope has grown: each task adds only 3% company progress.', taskPoints: 3, deskBonus: 0, restorePoints: 4 },
 { title: 'Recovery drill', description: 'Restoring a missing project file adds 8% company progress today.', taskPoints: 4, deskBonus: 0, restorePoints: 8 },
 { title: 'Teamwork Tuesday', description: 'Tasks add 5%; clearing your desk adds another 4%.', taskPoints: 5, deskBonus: 4, restorePoints: 4 }
];
export const PRACTICE_DURATIONS = { briefing: 8, work: 60, incident: 8, meeting: 25, vote: 15, appeal: 20, resolution: 8 };
