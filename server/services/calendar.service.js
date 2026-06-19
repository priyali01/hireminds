/**
 * Calendar Service
 * In a full production app, this would be a CRUD module with an admin panel.
 * For this MVP, we use a static database of major recurring Indian placement events.
 */

const STATIC_EVENTS = [
  {
    id: 'e1',
    title: 'TCS NQT Registration Open',
    type: 'drive',
    startDate: '2024-05-15',
    endDate: '2024-06-15',
    description: 'TCS National Qualifier Test for freshers.',
    url: 'https://learning.tcsionhub.in/hub/national-qualifier-test/'
  },
  {
    id: 'e2',
    title: 'Infosys InfyTQ Certification',
    type: 'drive',
    startDate: '2024-02-01',
    endDate: '2024-03-30',
    description: 'Certification exam for Infosys recruitment.'
  },
  {
    id: 'e3',
    title: 'SIH (Smart India Hackathon) Finale',
    type: 'hackathon',
    startDate: '2024-12-19',
    endDate: '2024-12-23',
    description: 'National level hackathon finale.'
  },
  {
    id: 'e4',
    title: 'Amazon SDE-1 Off-Campus Drive',
    type: 'drive',
    startDate: '2024-08-01',
    endDate: '2024-08-15',
    description: 'Amazon mass hiring for SDE-1 roles.'
  },
  {
    id: 'e5',
    title: 'Google Summer of Code (GSoC) Applications',
    type: 'open_source',
    startDate: '2024-03-18',
    endDate: '2024-04-02',
    description: 'Student application period for GSoC.'
  }
]

async function getUpcomingEvents() {
  // In a real database, we would query `startDate >= now`
  // We return the static list sorted roughly by month
  return STATIC_EVENTS
}

module.exports = {
  getUpcomingEvents
}
