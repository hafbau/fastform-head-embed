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
  let addedElements = []

  // Function to check if content is valid for head tag
  function isValidHeadContent(content) {
    // Check if content is already wrapped in script tags
    if (content.trim().startsWith("<script") && content.trim().endsWith("</script\>")) {
      return true
    }
    
    // Check if content contains only valid head elements
    const validHeadElements = ['script', 'link', 'meta', 'title', 'base', 'style']
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/html')
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
    if (content.trim().startsWith('<script') && content.trim().endsWith('</script>')) {
      return content
    }
    return `<script>${content}</script>`
  }

  // Function to safely add element to head
  async function addElementToHead(element) {
    return new Promise((resolve, reject) => {
      if (element.tagName === 'SCRIPT') {
        // For scripts, create a new script element and copy attributes
        const newScript = document.createElement('script')
        Array.from(element.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value)
        })
        
        // Handle script loading
        if (element.src) {
          newScript.onload = () => {
            addedElements.push(newScript)
            resolve()
          }
          newScript.onerror = (e) => {
            reject(new Error(`Failed to load script: ${element.src}`))
          }
        } else {
          newScript.textContent = element.textContent
          addedElements.push(newScript)
          resolve()
        }
        
        document.head.appendChild(newScript)
      } else {
        // For other elements, clone and append
        const newElement = element.cloneNode(true)
        addedElements.push(newElement)
        document.head.appendChild(newElement)
        resolve()
      }
    })
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
      const preparedContent = wrapInScript(content)

      // Create a temporary div to parse the content
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = preparedContent

      // Move all elements to head
      const elements = Array.from(tempDiv.children)
      for (const element of elements) {
        await addElementToHead(element)
      }

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

  // Cleanup on component destruction
  onDestroy(() => {
    // Remove all added elements from head
    addedElements.forEach(element => {
      if (element.parentNode === document.head) {
        document.head.removeChild(element)
      }
    })
  })
</script>

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