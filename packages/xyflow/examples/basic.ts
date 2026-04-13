/**
 * Basic usage example for @barefootjs/xyflow.
 *
 * Demonstrates:
 * - Creating a flow with nodes and edges
 * - Pan/zoom interaction
 * - Node dragging
 * - Click to select
 * - Delete selected with keyboard
 *
 * To run: import and call setupBasicFlow(containerElement)
 */

import { createRoot } from '@barefootjs/client'
import { initFlow, initBackground, initControls } from '../src/index'

export function setupBasicFlow(container: HTMLElement) {
  createRoot(() => {
    // Set container size
    container.style.width = '800px'
    container.style.height = '600px'

    // Initialize flow
    initFlow(container, {
      nodes: [
        { id: '1', position: { x: 50, y: 50 }, data: { label: 'Input Node' } },
        { id: '2', position: { x: 250, y: 100 }, data: { label: 'Process' } },
        { id: '3', position: { x: 450, y: 50 }, data: { label: 'Output Node' } },
        { id: '4', position: { x: 250, y: 250 }, data: { label: 'Side Effect' } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' },
        { id: 'e2-4', source: '2', target: '4' },
      ],
      fitView: true,
    })

    // Add background
    initBackground(container, { variant: 'dots', gap: 20, color: '#ddd' })

    // Add controls
    initControls(container, { position: 'bottom-left' })
  })
}

/**
 * Example with custom node types.
 */
export function setupCustomNodesFlow(container: HTMLElement) {
  createRoot(() => {
    container.style.width = '800px'
    container.style.height = '600px'

    initFlow(container, {
      nodes: [
        { id: '1', type: 'custom', position: { x: 50, y: 50 }, data: { label: 'Custom A', color: '#ff6b6b' } },
        { id: '2', type: 'custom', position: { x: 300, y: 100 }, data: { label: 'Custom B', color: '#4ecdc4' } },
        { id: '3', position: { x: 550, y: 50 }, data: { label: 'Default' } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' },
      ],
      nodeTypes: {
        custom: (props: any) => {
          // Plain function custom node
          const el = document.createElement('div')
          el.style.padding = '12px 24px'
          el.style.border = `2px solid ${props.data.color}`
          el.style.borderRadius = '8px'
          el.style.backgroundColor = props.data.color + '20'
          el.style.fontWeight = 'bold'
          el.textContent = props.data.label
          // The function receives NodeComponentProps
          // but since it's a plain function, we'd need the parent el
        },
      },
      fitView: true,
    })
  })
}
