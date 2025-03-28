<script>
  import { getContext } from "svelte"
  import { onMount, onDestroy } from 'svelte'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()
  const { styleable, Provider } = getContext("sdk")
  const component = getContext("component")

  export let content
  export let onMountEvent
  export let onEmbedded

  let status = 'initializing'
  let error = null
  let headContent = ''

  // Constants for script tags to avoid string issues
  const SCRIPT_START = "<script"
  const SCRIPT_END = "</script\>"

  // Function to check if content is valid for head tag
  function isValidHeadContent(content) {
    // Check if content is already wrapped in script tags
    if (content.trim().startsWith(SCRIPT_START) && content.trim().endsWith(SCRIPT_END)) {
      return true
    }
    
    // Check if content contains only valid head elements
    const validHeadElements = ['script', 'link', 'meta', 'title', 'base', 'style']
    let doc
    try {
      doc = new DOMParser().parseFromString(content, 'text/html')
    } catch (e) {
      console.error("Error parsing content:", e)
      return false
    }
    const elements = doc.head.children
    
    // If there are no elements, content might be inline script
    if (elements.length === 0) {
      return true
    }

    // Check if all elements are valid head elements
    return Array.from(elements).every(el => validHeadElements.includes(el.tagName.toLowerCase()))
  }

  // Function to wrap content in script tags if needed
  function wrapInScript(content) {
    if (content.trim().startsWith(SCRIPT_START) && content.trim().endsWith(SCRIPT_END)) {
      return content
    }
    return `${SCRIPT_START}>${content}${SCRIPT_END}`
  }

  onMount(async () => {
    try {
      status = 'loading'
      // Trigger onMount event
      onMountEvent?.()
      dispatch('mount')

      // Validate and prepare content
      if (!content) {
        throw new Error('No content provided')
      }

      // Check if content is valid for head
      if (!isValidHeadContent(content)) {
        throw new Error("Invalid content for head tag. Only script, link, meta, title, base, and style elements are allowed.")
      }

      // Wrap in script tags if needed
      headContent = wrapInScript(content)

      status = 'embedded'
      onEmbedded?.()
      dispatch('embedded')
    } catch (e) {
      status = 'error'
      error = e.message
      console.error('Error embedding content:', e)
      dispatch('error', { error: e.message })
    }
  })
</script>

<svelte:head>
  {@html headContent}
</svelte:head>

<div use:styleable={$component.styles}>
  <Provider data={{ status, error }}>
    <div class="head-embed-status">
      {#if status === 'initializing'}
        Initializing head embed...
      {:else if status === 'loading'}
        Loading and embedding content...
      {:else if status === 'embedded'}
        Content successfully embedded in head
      {:else if status === 'error'}
        Error: {error}
      {/if}
    </div>
  </Provider>
</div>

<style>
  .head-embed-status {
    padding: 1rem;
    border-radius: 4px;
    background: #f5f5f5;
    font-size: 0.9em;
    color: #666;
    margin: 0.5rem 0;
  }
</style>