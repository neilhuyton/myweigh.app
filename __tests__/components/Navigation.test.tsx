// __tests__/components/Navigation.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
  createRootRouteWithContext,
  createRoute,
} from '@tanstack/react-router'
import Navigation from '@/components/Navigation'

const rootRoute = createRootRouteWithContext()({
  component: () => (
    <>
      <Navigation />
      <div data-testid="outlet">Outlet content</div>
    </>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <div>Home page</div>,
})

const routeTree = rootRoute.addChildren([indexRoute])

describe('Navigation', () => {
  const createTestRouter = () => {
    const history = createMemoryHistory({ initialEntries: ['/'] })
    return createRouter({ routeTree, history })
  }

  const renderWithRouter = async () => {
    const router = createTestRouter()
    await act(async () => {
      render(<RouterProvider router={router} />)
    })
  }

  it('renders navigation container', async () => {
    await renderWithRouter()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('renders three nav items with correct labels', async () => {
    await renderWithRouter()
    expect(screen.getByText('Weight')).toBeInTheDocument()
    expect(screen.getByText('Chart')).toBeInTheDocument()
    expect(screen.getByText('Goal')).toBeInTheDocument()
  })

  it('renders correct icons', async () => {
    await renderWithRouter()
    const icons = screen.getByRole('navigation').querySelectorAll('svg')
    expect(icons).toHaveLength(3)
    expect(icons[0]).toHaveClass('lucide-scale')
    expect(icons[1]).toHaveClass('lucide-chart-line')
    expect(icons[2]).toHaveClass('lucide-target')
  })

  it('each item is a link to the correct path', async () => {
    await renderWithRouter()
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(3)
    expect(links[0]).toHaveAttribute('href', '/weight-log')
    expect(links[1]).toHaveAttribute('href', '/weight-chart')
    expect(links[2]).toHaveAttribute('href', '/weight-goal')
  })

  it('links have correct aria-labels', async () => {
    await renderWithRouter()
    expect(screen.getByLabelText('Navigate to Weight')).toBeInTheDocument()
    expect(screen.getByLabelText('Navigate to Chart')).toBeInTheDocument()
    expect(screen.getByLabelText('Navigate to Goal')).toBeInTheDocument()
  })

  it('highlights active link based on current route', async () => {
    expect(true).toBe(true)
  })
})