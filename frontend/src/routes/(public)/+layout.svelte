<script>
	import Navbar from '$lib/Navbar.svelte';
	import { page } from '$app/stores'; // Necesario para saber en qué URL estamos

	// Lista negra: Rutas donde NO queremos ver el Navbar
	const hideNavbarRoutes = ['/login', '/register'];

	// Variable reactiva ($:): Se recalcula automáticamente cuando cambia la URL ($page)
	// Devuelve true si la ruta actual NO está en la lista negra
	$: showNavbar = !hideNavbarRoutes.includes($page.url.pathname);
</script>

<div
	class="min-h-screen bg-body-gradient text-white font-sans relative overflow-x-hidden selection:bg-vision-primary selection:text-white"
>
	<div
		class="fixed top-0 left-0 w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"
	></div>
	<div
		class="fixed bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 pointer-events-none z-0"
	></div>

	{#if showNavbar}
		<Navbar />
	{/if}

	<main class="relative z-10 p-6">
		<slot />
	</main>
</div>
