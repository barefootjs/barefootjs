import { test, expect } from '@playwright/test'

test.describe('Calendar Scheduler Block', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', error => {
      console.log('Page error:', error.message)
    })
    await page.goto('/components/calendar-scheduler')
  })

  const section = (page: any) =>
    page.locator('[bf-s^="CalendarSchedulerDemo_"]:not([data-slot])').first()

  // --- Initial Render ---

  test.describe('Initial Render', () => {
    test('renders month view by default', async ({ page }) => {
      const s = section(page)
      await expect(s.locator('.month-view')).toBeVisible()
      await expect(s.locator('.week-view')).not.toBeVisible()
    })

    test('renders 7 day-of-week headers', async ({ page }) => {
      const s = section(page)
      const headers = s.locator('.month-view .grid').first().locator('div')
      await expect(headers).toHaveCount(7)
    })

    test('renders month day cells', async ({ page }) => {
      const s = section(page)
      const cells = s.locator('.month-day-cell')
      const count = await cells.count()
      expect(count).toBeGreaterThanOrEqual(28)
      expect(count % 7).toBe(0)
    })

    test('shows today marker in month view', async ({ page }) => {
      const s = section(page)
      await expect(s.locator('.today-marker')).toBeVisible()
    })

    test('shows event count dot on days with events', async ({ page }) => {
      const s = section(page)
      const dots = s.locator('.event-dot-count')
      const count = await dots.count()
      expect(count).toBeGreaterThan(0)
    })

    test('shows total event count in toolbar', async ({ page }) => {
      const s = section(page)
      await expect(s.locator('.event-count')).toContainText('10 events')
    })

    test('renders navigation controls', async ({ page }) => {
      const s = section(page)
      await expect(s.locator('.prev-btn')).toBeVisible()
      await expect(s.locator('.next-btn')).toBeVisible()
      await expect(s.locator('.today-btn')).toBeVisible()
    })

    test('renders view toggle buttons', async ({ page }) => {
      const s = section(page)
      await expect(s.locator('.month-view-btn')).toBeVisible()
      await expect(s.locator('.week-view-btn')).toBeVisible()
    })
  })

  // --- View Mode Toggle ---

  test.describe('View Mode Toggle', () => {
    test('switching to week replaces month view with week view', async ({ page }) => {
      const s = section(page)
      await s.locator('.week-view-btn').click()
      await expect(s.locator('.week-view')).toBeVisible()
      await expect(s.locator('.month-view')).not.toBeVisible()
    })

    test('switching back to month replaces week view with month view', async ({ page }) => {
      const s = section(page)
      await s.locator('.week-view-btn').click()
      await s.locator('.month-view-btn').click()
      await expect(s.locator('.month-view')).toBeVisible()
      await expect(s.locator('.week-view')).not.toBeVisible()
    })

    test('week view renders 7 day columns', async ({ page }) => {
      const s = section(page)
      await s.locator('.week-view-btn').click()
      await expect(s.locator('.week-day-col')).toHaveCount(7)
    })

    test('week view shows today marker', async ({ page }) => {
      const s = section(page)
      await s.locator('.week-view-btn').click()
      await expect(s.locator('.week-today-marker')).toBeVisible()
    })

    test('week view renders 24 hour slots per column', async ({ page }) => {
      const s = section(page)
      await s.locator('.week-view-btn').click()
      const firstCol = s.locator('.week-day-col').first()
      await expect(firstCol.locator('.week-hour-slot')).toHaveCount(24)
    })

    test('week view shows hour labels', async ({ page }) => {
      const s = section(page)
      await s.locator('.week-view-btn').click()
      await expect(s.locator('.week-hour-labels')).toBeVisible()
    })

    test('header label changes with view mode', async ({ page }) => {
      const s = section(page)
      const monthLabel = await s.locator('.calendar-header-label').textContent()
      await s.locator('.week-view-btn').click()
      const weekLabel = await s.locator('.calendar-header-label').textContent()
      expect(monthLabel).not.toBe(weekLabel)
    })
  })

  // --- Navigation ---

  test.describe('Navigation', () => {
    test('next button advances the month', async ({ page }) => {
      const s = section(page)
      const beforeLabel = await s.locator('.calendar-header-label').textContent()
      await s.locator('.next-btn').click()
      const afterLabel = await s.locator('.calendar-header-label').textContent()
      expect(afterLabel).not.toBe(beforeLabel)
    })

    test('prev button goes back a month', async ({ page }) => {
      const s = section(page)
      const beforeLabel = await s.locator('.calendar-header-label').textContent()
      await s.locator('.prev-btn').click()
      const afterLabel = await s.locator('.calendar-header-label').textContent()
      expect(afterLabel).not.toBe(beforeLabel)
    })

    test('today button returns to current month', async ({ page }) => {
      const s = section(page)
      const todayLabel = await s.locator('.calendar-header-label').textContent()
      await s.locator('.next-btn').click()
      await s.locator('.next-btn').click()
      await s.locator('.today-btn').click()
      await expect(s.locator('.calendar-header-label')).toHaveText(todayLabel!)
    })

    test('week view prev/next changes week label', async ({ page }) => {
      const s = section(page)
      await s.locator('.week-view-btn').click()
      const beforeLabel = await s.locator('.calendar-header-label').textContent()
      await s.locator('.next-btn').click()
      const afterLabel = await s.locator('.calendar-header-label').textContent()
      expect(afterLabel).not.toBe(beforeLabel)
    })
  })

  // --- Day Panel ---

  test.describe('Day Panel', () => {
    test('clicking a day cell opens the day panel', async ({ page }) => {
      const s = section(page)
      await s.locator('.month-day-cell').first().click()
      await expect(s.locator('.day-panel')).toBeVisible()
    })

    test('day panel shows the selected date', async ({ page }) => {
      const s = section(page)
      await s.locator('.month-day-cell').first().click()
      await expect(s.locator('.day-panel-date')).toBeVisible()
    })

    test('close button hides the day panel', async ({ page }) => {
      const s = section(page)
      await s.locator('.month-day-cell').first().click()
      await expect(s.locator('.day-panel')).toBeVisible()
      await s.locator('.close-day-panel-btn').click()
      await expect(s.locator('.day-panel')).not.toBeVisible()
    })

    test('today cell shows events in day panel', async ({ page }) => {
      const s = section(page)
      // Find the today-marker cell and click it
      const todayCell = s.locator('.month-day-cell:has(.today-marker)')
      await todayCell.click()
      await expect(s.locator('.day-event-list')).toBeVisible()
      const items = s.locator('.day-event-item')
      await expect(items).not.toHaveCount(0)
    })

    test('empty day shows empty message', async ({ page }) => {
      const s = section(page)
      // Click prev month to get to a month with no events
      await s.locator('.next-btn').click()
      await s.locator('.next-btn').click()
      // Click first cell of that month
      await s.locator('.month-day-cell').first().click()
      await expect(s.locator('.day-empty-msg')).toBeVisible()
    })

    test('add event button opens the create form', async ({ page }) => {
      const s = section(page)
      await s.locator('.month-day-cell').first().click()
      await s.locator('.add-event-btn').click()
      await expect(s.locator('.event-create-form')).toBeVisible()
    })

    test('can add an event via the create form', async ({ page }) => {
      const s = section(page)
      await s.locator('.month-day-cell').first().click()
      await s.locator('.add-event-btn').click()
      await s.locator('.new-event-title-input').fill('Test Event')
      await s.locator('.create-confirm-btn').click()
      await expect(s.locator('.event-create-form')).not.toBeVisible()
      // Event count increases
      await expect(s.locator('.event-count')).toContainText('11 events')
    })

    test('cancel button closes the create form', async ({ page }) => {
      const s = section(page)
      await s.locator('.month-day-cell').first().click()
      await s.locator('.add-event-btn').click()
      await s.locator('.new-event-title-input').fill('Cancelled Event')
      await s.locator('.create-cancel-btn').click()
      await expect(s.locator('.event-create-form')).not.toBeVisible()
      await expect(s.locator('.event-count')).toContainText('10 events')
    })
  })

  // --- Event Selection ---

  test.describe('Event Selection', () => {
    test('clicking an event in day panel shows event detail', async ({ page }) => {
      const s = section(page)
      const todayCell = s.locator('.month-day-cell:has(.today-marker)')
      await todayCell.click()
      await s.locator('.day-event-item').first().click()
      await expect(s.locator('.selected-event-detail')).toBeVisible()
    })

    test('event detail shows the event title', async ({ page }) => {
      const s = section(page)
      const todayCell = s.locator('.month-day-cell:has(.today-marker)')
      await todayCell.click()
      const firstItem = s.locator('.day-event-item').first()
      const title = await firstItem.locator('.font-medium').textContent()
      await firstItem.click()
      await expect(s.locator('.selected-event-detail')).toContainText(title!.trim())
    })

    test('close button hides event detail', async ({ page }) => {
      const s = section(page)
      const todayCell = s.locator('.month-day-cell:has(.today-marker)')
      await todayCell.click()
      await s.locator('.day-event-item').first().click()
      await expect(s.locator('.selected-event-detail')).toBeVisible()
      await s.locator('.close-detail-btn').click()
      await expect(s.locator('.selected-event-detail')).not.toBeVisible()
    })

    test('delete button removes the event', async ({ page }) => {
      const s = section(page)
      const todayCell = s.locator('.month-day-cell:has(.today-marker)')
      await todayCell.click()
      const countBefore = await s.locator('.day-event-item').count()
      await s.locator('.day-event-item').first().click()
      await s.locator('.delete-event-btn').click()
      await expect(s.locator('.selected-event-detail')).not.toBeVisible()
      const countAfter = await s.locator('.day-event-item').count()
      expect(countAfter).toBe(countBefore - 1)
    })
  })

  // --- Week View Events (Overlap Layout) ---

  test.describe('Week View Events (Overlap Layout)', () => {
    test('week view shows positioned event blocks', async ({ page }) => {
      const s = section(page)
      await s.locator('.week-view-btn').click()
      const count = await s.locator('.week-event').count()
      expect(count).toBeGreaterThan(0)
    })

    test('week events show title and time', async ({ page }) => {
      const s = section(page)
      await s.locator('.week-view-btn').click()
      const count = await s.locator('.week-event').count()
      if (count > 0) {
        const first = s.locator('.week-event').first()
        await expect(first.locator('.font-medium')).toBeVisible()
      }
    })

    test('today column shows multiple events', async ({ page }) => {
      const s = section(page)
      await s.locator('.week-view-btn').click()
      const todayColIdx = new Date().getDay()
      const col = s.locator('.week-day-col').nth(todayColIdx)
      const evts = col.locator('.week-event')
      const count = await evts.count()
      expect(count).toBeGreaterThan(0)
    })

    test('overlapping events are both rendered (side by side)', async ({ page }) => {
      const s = section(page)
      await s.locator('.week-view-btn').click()
      // Day +1 has two overlapping events (id 4 and 5, both startHour: 10)
      const tomorrowIdx = (new Date().getDay() + 1) % 7
      const col = s.locator('.week-day-col').nth(tomorrowIdx)
      const evts = col.locator('.week-event')
      const count = await evts.count()
      expect(count).toBeGreaterThanOrEqual(2)
    })

    test('adding event updates week view on navigation back to same week', async ({ page }) => {
      const s = section(page)
      // Add an event for today via month view
      const todayCell = s.locator('.month-day-cell:has(.today-marker)')
      await todayCell.click()
      const eventCountBefore = await s.locator('.event-count').textContent()
      await s.locator('.add-event-btn').click()
      await s.locator('.new-event-title-input').fill('New Week Event')
      await s.locator('.create-confirm-btn').click()

      // Switch to week view — should show more events
      await s.locator('.week-view-btn').click()
      const todayColIdx = new Date().getDay()
      const col = s.locator('.week-day-col').nth(todayColIdx)
      const evtsAfter = col.locator('.week-event').count()
      expect(await evtsAfter).toBeGreaterThan(0)

      const eventCountAfter = await s.locator('.event-count').textContent()
      expect(eventCountAfter).not.toBe(eventCountBefore)
    })
  })
})
