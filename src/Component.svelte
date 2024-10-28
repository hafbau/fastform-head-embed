<script>
  import { getContext } from "svelte"
  import { onMount } from 'svelte'
  import { loadStripe } from '@stripe/stripe-js'
  import { Elements, CardNumber, CardCvc, CardExpiry } from 'svelte-stripe'


  export let PUBLIC_STRIPE_KEY
  // export let elementType
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
  
  $: dataContext =  {
    __stripe: stripe,
    __elements: elements,
    __token: "",
    processing: false,
    tokenizeAttempt: 0
  }

  $: error = ''

  async function submit() {
    try {
      dataContext.processing = true
      const token = await stripe.createToken(element, { name });
      dataContext.processing = false
      dataContext.__token = token
      onSubmit?.({token})
    } catch (e) {
      dataContext.processing = false
      console.error(e);
      error = e?.message ?? e
    }
  }
</script>


<div use:styleable={$component.styles}>
  {#if error}
    <p class="error">{error.message} Please try again.</p>
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
      <!-- <form on:submit|preventDefault={submit}> -->
      <CardNumber bind:element={element} classes={{ base: 'stripe-elements-input' }} />

      <div class="row">
        <CardExpiry classes={{ base: 'stripe-elements-input' }} />
        <CardCvc classes={{ base: 'stripe-elements-input' }} />
      </div>
      <div on:click|preventDefault={submit} on:keyup={submit}>
        <slot />
      </div>
        <!-- <button disabled={dataContext.processing}>
          {#if dataContext.processing}
            Processing...
          {:else}
            Continue
          {/if}
        </button> -->
      <!-- </form> -->
    </Elements>
  </Provider>
</div>

<style>
  .error {
    color: tomato;
    margin: 2rem 0 0;
  }

  /* form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 2rem 0;
  } */

  .row {
    display: flex;
    flex-direction: row;
    gap: 5px;
  }

  /* input, */
  :global(.stripe-elements-input) {
    border: solid 1px var(--gray-color);
    padding: 1rem;
    border-radius: 5px;
    background: white;
  }

  /* .row :global(.stripe-elements-input) {
    width: 20%;
  } */

  /* button {
    padding: 1rem;
    border-radius: 5px;
    border: solid 1px #ccc;
    color: white;
    background: var(--link-color);
    font-size: 1.2rem;
    margin: 1rem 0;
  } */
</style>