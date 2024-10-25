<script>
  import { getContext } from "svelte"
  import { onMount } from 'svelte'
  import { loadStripe } from '@stripe/stripe-js'
  import { Elements, PaymentElement, Address, Card } from 'svelte-stripe'


  export let PUBLIC_STRIPE_KEY
  export let elementType
  export let theme
  export let labels

  export let rules
  export let elementOptions
  export let elementsOptions
  export let variables
  export let onSubmit

  const { styleable, Provider } = getContext("sdk")
  const component = getContext("component")
  let stripe = null
  let elements

  onMount(async () => {
    stripe = await loadStripe(PUBLIC_STRIPE_KEY)
  })

  function tryParse(value) {
    try {
      return JSON.parse(value)
    } catch (e) {
      console.error(e)
      return {}
    }
  }

  $: rules = tryParse(rules)
  $: elementOptions = tryParse(elementOptions)
  $: elementsOptions = tryParse(elementsOptions)
  $: variables = tryParse(variables)
  
  $: dataContext =  {
    __stripe: stripe,
    __elements: elements,
    __token: "",
    processing: false,
    tokenizeAttempt: 0
  }

  async function submit() {
    dataContext.processing = true
    const token = await elements.createToken()
    dataContext.processing = false
    dataContext.__token = token
    onSubmit?.({token})
  }
</script>

<div use:styleable={$component.styles}>
  <Provider data={dataContext}>
    <Elements
      mode="setup"
      currency="usd"
      {...elementsOptions}
      {stripe}
      {theme}
      {labels}
      {variables}
      {rules}
      bind:elements
    >
      <form on:submit|preventDefault={submit}>
        {#if elementType === 'payment'}
          <PaymentElement options={elementOptions}/>
        {:else if elementType === 'address'}
          <Address  mode='billing' {...elementOptions} />
        {:else if elementType === 'card'}
          <Card {...elementOptions} />
        {:else}
          <p>Unknown element type: {elementType}</p>
        {/if}
        <button disabled={dataContext.processing}>
          {#if dataContext.processing}
            Processing...
          {:else}
            Pay
          {/if}
        </button>
      </form>
    </Elements>
  </Provider>
</div>