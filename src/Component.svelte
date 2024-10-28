<script>
  import { getContext } from "svelte"
  import { onMount } from 'svelte'
  import { loadStripe } from '@stripe/stripe-js'
  import { Elements, CardNumber, CardCvc, CardExpiry } from 'svelte-stripe'


  export let PUBLIC_STRIPE_KEY
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
  let element
  let name

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

  $: error = ''
  $: dataContext =  {
    __stripe: stripe,
    __elements: elements,
    __token: "",
    processing: false,
    __error: error
  }

  async function submit() {
    try {
      dataContext.processing = true
      const {token, error} = await stripe.createToken(element, { name });
      dataContext.processing = false
      if (token) {
        dataContext.__token = token
        onSubmit?.({token})
      } else throw error
    } catch (e) {
      dataContext.processing = false
      console.error(e);
      error = e?.message ?? e
    }
  }
</script>


<div use:styleable={$component.styles}>
  {#if error}
    <p class="error">{error} Please try again.</p>
  {/if}
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
      <CardNumber bind:element={element} classes={{ base: 'stripe-elements-input' }} {...elementOptions}/>

      <div class="row">
        <CardExpiry classes={{ base: 'stripe-elements-input' }} {...elementOptions}/>
        <CardCvc classes={{ base: 'stripe-elements-input' }} {...elementOptions}/>
      </div>
      <div on:click|preventDefault={submit} on:keyup={submit}>
        <slot />
      </div>
    </Elements>
  </Provider>
</div>

<style>
  .error {
    color: tomato;
    margin: 2rem 0 0;
  }

  .row {
    display: flex;
    flex-direction: row;
    gap: 5px;
  }

  :global(.stripe-elements-input) {
    border: solid 1px #cacaca;
    padding: 1em;
    border-radius: 5px;
    background: white;
    margin-bottom: 1.5em;
  }

  .row :global(.stripe-elements-input) {
    width: 30%;
  }
</style>