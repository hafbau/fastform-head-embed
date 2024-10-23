<script>
  import { getContext, setContext } from "svelte"
  import { onMount } from 'svelte'
  import { loadStripe } from '@stripe/stripe-js'
  import { Elements, PaymentElement, Address, Card } from 'svelte-stripe'


  export let PUBLIC_STRIPE_KEY
  export let elementType
  export let theme
  export let labels

  export let rules
  export let elementOptions
  export let variables

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
  $: variables = tryParse(variables)
  

  setContext("stripe-elements", {
    __stripe,
    __elements,
    __token: "",
    processing: false,
    tokenizeAttempt: 0
  });

  function tokenize() {
    const ctx = getContext("stripe-elements");
    console.log('TokenizeElements', ctx);
    if (ctx?.tokenizeAttempt > 3) {
      console.log('TokenizeElements failed after 3 attempts');
      setContext("stripe-elements", { ...ctx, processing: false, tokenizeAttempt: 0 });
      return;
    }
    if (ctx?.__token) return ctx.__token;
    if (ctx?.processing) return;
    setContext("stripe-elements", { ...ctx, processing: true, tokenizeAttempt: ctx.tokenizeAttempt + 1 });
    return stripe.createToken(elements).then((result) => {
      if (result.error) {
        console.log('Error', result.error)
        setContext("stripe-elements", { ...ctx, processing: false, tokenizeAttempt: 0 });
      } else {
        console.log('Success', result.token)
        setContext("stripe-elements", { ...ctx, processing: false, __token: result.token, tokenizeAttempt: 0 });
        return result.token;
      }
    });
  }
  const actions = [
    {
      type: 'TokenizeElements',
      callback: tokenize,
    }
  ]
  $: dataContext =  getContext("stripe-elements");
</script>

<div use:styleable={$component.styles}>
  <Provider {actions} data={dataContext}>
    <Elements
      {stripe}
      {theme}
      {labels}
      {variables}
      {rules}
      bind:elements
    >
    {#if elementType === 'payment'}
      <PaymentElement options={elementOptions}/>
    {:else if elementType === 'address'}
      <Address {...elementOptions} />
    {:else if elementType === 'card'}
      <Card {...elementOptions} />
    {:else}
      <p>Unknown element type: {elementType}</p>
    {/if}
    </Elements>
  </Provider>
</div>
