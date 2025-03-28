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
  let scriptContent = ''

  // Function to check if content is valid for head tag
  function isValidHeadContent(content) {
    // For simple script content, just check if it's valid JavaScript
    if (!content.includes('<')) {
      try {
        // Try to parse as JavaScript
        new Function(content)
        return true
      } catch (e) {
        return false
      }
    }
    
    // For HTML content, check if it contains only valid head elements
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

      // Check if content is valid
      if (!isValidHeadContent(content)) {
        throw new Error("Invalid content. Must be valid JavaScript or HTML with valid head elements.")
      }

      // Set the script content
      scriptContent = content

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
  {#if scriptContent}
    <script>
      {scriptContent}
    </script>
  {/if}
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