<script>
  import { getContext, onMount, createEventDispatcher } from "svelte"

  console.log('1. Component initialization start')
  
  const dispatch = createEventDispatcher()
  const { styleable, Provider } = getContext("sdk")
  const component = getContext("component")

  console.log('2. Context and props setup complete')

  export let content
  export let onMountEvent
  export let onEmbedded

  let status = 'initializing'
  let error = null
  let headContent = ''
  let isScriptContent = false

  console.log('3. State variables initialized')

  // Function to check if content is valid for head tag
  function isValidHeadContent(content) {
    console.log('4. Validating content:', content)
    return true
    
    // For simple script content, just check if it's valid JavaScript
    if (!content.includes('<')) {
      try {
        console.log('5. Attempting to parse as JavaScript')
        new Function(content)
        isScriptContent = true
        return true
      } catch (e) {
        console.log('6. JavaScript parsing failed:', e)
        return false
      }
    }
    
    console.log('7. Parsing as HTML content')
    // For HTML content, check if it contains only valid head elements
    const validHeadElements = ['script', 'link', 'meta', 'title', 'base', 'style']
    let doc
    try {
      doc = new DOMParser().parseFromString(content, 'text/html')
      console.log('8. HTML parsing successful')
    } catch (e) {
      console.log('9. HTML parsing failed:', e)
      console.error("Error parsing content:", e)
      return false
    }
    const elements = []//doc.head.children
    
    // If there are no elements, content might be inline script
    if (elements.length === 0) {
      console.log('10. No elements found, treating as inline script')
      isScriptContent = true
      return true
    }

    console.log('11. Validating head elements')
    // Check if all elements are valid head elements
    return Array.from(elements).every(el => validHeadElements.includes(el.tagName.toLowerCase()))
  }

  onMount(() => {
    console.log('12. Component mounted')
    try {
      status = 'loading'
      console.log('13. Status set to loading')
      
      // Trigger onMount event
      console.log('14. Triggering onMount event')
      onMountEvent?.()
      dispatch('mount')

      // Validate and prepare content
      if (!content) {
        console.log('15. No content provided')
        throw new Error('No content provided')
      }

      console.log('16. Validating content')
      // Check if content is valid
      if (!isValidHeadContent(content)) {
        console.log('17. Content validation failed')
        throw new Error("Invalid content. Must be valid JavaScript or HTML with valid head elements.")
      }

      console.log('18. Setting head content')
      // Set the head content
      headContent = content

      console.log('19. Setting status to embedded')
      status = 'embedded'
      onEmbedded?.()
      dispatch('embedded')
    } catch (e) {
      console.log('20. Error caught:', e)
      status = 'error'
      error = e.message
      console.error('Error embedding content:', e)
      dispatch('error', { error: e.message })
    }
  })

  console.log('21. Script setup complete')
</script>

<!-- <svelte:head>
  {#if headContent}
    {#if isScriptContent}
      <script>
        console.log('22. Executing script content')
        {headContent}
      </script>
    {:else}
      {@html headContent}
    {/if}
  {/if}
</svelte:head> -->

<div use:styleable={$component.styles}>
  <Provider data={{ status, error }}>
    <div class="head-embed-status">
      {#if status === 'initializing'}
        Initializing head embed...
      {:else if status === 'loading'}
        Loading and embedding content...
      {:else if status === 'embedded'}
        Content successfully embedded in head
        <div>{headContent}</div>
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