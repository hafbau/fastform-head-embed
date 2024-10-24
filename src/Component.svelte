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

  const { styleable } = getContext("sdk")
  const component = getContext("component")
  let stripe = null
  let elements
  let processing = false
  let token = ""
  let error
  onMount(async () => {
    stripe = await loadStripe(PUBLIC_STRIPE_KEY)
  })

  function tryParse(value) {
    try {
      return JSON.parse(value)
    } catch (e) {
      console.log('StripeElements::Error parsing', value)
      console.error(e)
      return {}
    }
  }

  $: rules = tryParse(rules)
  $: elementOptions = tryParse(elementOptions)
  $: elementsOptions = tryParse(elementsOptions)
  $: variables = tryParse(variables)
  

  $: dataContext = {
    __stripe: stripe,
    __elements: elements,
    __token: token,
    processing: processing
  };

  function handleResult(result) {
    if (result.error) {
      error = result.error
      processing = false
    } else {
      token = result.token
      processing = false
      onSubmit(token)
    }
  }
  
  function tokenize() {
    console.log('TokenizeElements', $dataContext);
    if ($dataContext?.__token) return $dataContext.__token;
    if ($dataContext?.processing) return;
    processing = true;
    stripe.createToken(elements).then(result => {
      handleResult(result);
    })
  }
</script>

<div use:styleable={$component.styles}>
  {#if error}
    <p class="error">{error.message} Please try again.</p>
  {/if}
  <!-- <Provider data={dataContext}> -->
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
      <form on:submit|preventDefault={tokenize}>
        {#if elementType === 'payment'}
          <PaymentElement options={elementOptions}/>
        {:else if elementType === 'address'}
          <Address {...elementOptions} />
        {:else if elementType === 'card'}
          <Card {...elementOptions} />
        {:else}
          <p>Unknown element type: {elementType}</p>
        {/if}
        <button type="submit" disabled={processing}>
          {#if processing}
            Processing...
          {:else}
            Continue
          {/if}
        </button>
      </form>
    </Elements>
  <!-- </Provider> -->
</div>
