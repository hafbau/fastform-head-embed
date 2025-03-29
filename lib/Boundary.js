import Boundary from "./Boundary.svelte"
import { createBoundary } from "@crownframework/svelte-error-boundary"

// Create a simple wrapper component that properly initializes the boundary
const BoundaryWrapper = createBoundary(Boundary);

export default BoundaryWrapper;