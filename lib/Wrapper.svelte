<script>
    import Component from "../src/Component.svelte"
    import Boundary from "./Boundary.svelte" 
</script>

<Boundary>
  <Component {...$$props}>
    <slot/>
  </Component>
</Boundary>