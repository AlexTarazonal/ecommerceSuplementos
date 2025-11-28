<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let usuario = { nombre: 'Cargando...', rol: '' };
	let loading = true;

	onMount(() => {
		const token = localStorage.getItem('token');
		const userStored = localStorage.getItem('usuario');

		if (!token || !userStored) {
			goto('/login');
			return;
		}

		usuario = JSON.parse(userStored);
		if (usuario.rol !== 'admin') {
			goto('/tienda');
		} else {
			loading = false;
		}
	});

	function handleLogout() {
		localStorage.removeItem('token');
		localStorage.removeItem('usuario');
		goto('/login');
	}

	$: isActive = (path: string) => $page.url.pathname.includes(path);
</script>

{#if !loading}
	<!-- 
      CONTENEDOR PRINCIPAL
      Quitamos 'bg-body-gradient' y usamos un color base sólido #0f172a 
      para que las luces resalten encima.
    -->
	<div class="min-h-screen w-full bg-[#0f172a] text-white font-sans flex relative overflow-hidden">
		<!-- ================================================================= -->
		<!-- FONDO GLOBAL ANIMADO (Luces Vision UI) -->
		<!-- Se aplica a TODAS las páginas del admin -->
		<!-- ================================================================= -->
		<div class="fixed inset-0 z-0 pointer-events-none overflow-hidden">
			<!-- Luz Superior Izquierda (Azul) -->
			<div
				class="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/20 rounded-full blur-[120px]"
			></div>

			<!-- Luz Central (Cian - Da el efecto de profundidad en medio) -->
			<div
				class="absolute top-[20%] left-[30%] w-[40vw] h-[40vw] bg-cyan-500/10 rounded-full blur-[150px] mix-blend-screen"
			></div>

			<!-- Luz Inferior Derecha (Violeta) -->
			<div
				class="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/20 rounded-full blur-[120px]"
			></div>
		</div>

		<!-- Sidebar Container - Fixed and Isolated -->
		<aside class="fixed top-0 left-0 h-screen w-72 p-4 z-50">
			<!-- Inner Sidebar - Flex Column -->
			<div
				class="h-full w-full rounded-3xl bg-[#0f172a]/70 backdrop-blur-xl border border-white/20 flex flex-col shadow-2xl relative overflow-hidden transition-all"
			>
				<!-- Background Effects (Absolute inside sidebar) -->
				<div
					class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-blue-600/20 blur-[50px] pointer-events-none"
				></div>

				<!-- Header (Logo) -->
				<div class="flex-none py-8 text-center border-b border-white/10 mx-6 mb-2 relative z-10">
					<h1 class="text-sm font-bold tracking-[0.2em] uppercase text-white">
						Nutri<span class="text-blue-500">Store</span>
					</h1>
				</div>

				<!-- Navigation -->
				<nav class="flex-1 overflow-y-auto px-4 py-4 space-y-2 relative z-10">
					<p
						class="text-[10px] font-bold text-gray-400 uppercase ml-3 mb-2 tracking-wider opacity-80"
					>
						Principal
					</p>

					<!-- Dashboard Link -->
					<a
						href="/admin/dashboard"
						class="flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 group
                       {isActive('/admin/dashboard')
							? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40'
							: 'text-gray-400 hover:text-white hover:bg-white/10'}"
					>
						<div
							class="p-1.5 rounded-lg transition-colors {isActive('/admin/dashboard')
								? 'bg-white/20'
								: 'bg-[#1a2035] group-hover:bg-blue-500/20'}"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><rect x="3" y="3" width="7" height="7"></rect><rect
									x="14"
									y="3"
									width="7"
									height="7"
								></rect><rect x="14" y="14" width="7" height="7"></rect><rect
									x="3"
									y="14"
									width="7"
									height="7"
								></rect></svg
							>
						</div>
						Dashboard
					</a>

					<!-- Productos Link -->
					<a
						href="/admin/products"
						class="flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 group
                       {isActive('/admin/products')
							? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40'
							: 'text-gray-400 hover:text-white hover:bg-white/10'}"
					>
						<div
							class="p-1.5 rounded-lg transition-colors {isActive('/admin/products')
								? 'bg-white/20'
								: 'bg-[#1a2035] group-hover:bg-blue-500/20'}"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
								/></svg
							>
						</div>
						Productos
					</a>

					<!-- Users Link -->
					<a
						href="/admin/users"
						class="flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 group
                       {isActive('/admin/users')
							? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40'
							: 'text-gray-400 hover:text-white hover:bg-white/10'}"
					>
						<div
							class="p-1.5 rounded-lg transition-colors {isActive('/admin/users')
								? 'bg-white/20'
								: 'bg-[#1a2035] group-hover:bg-blue-500/20'}"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle
									cx="9"
									cy="7"
									r="4"
								></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path
									d="M16 3.13a4 4 0 0 1 0 7.75"
								></path></svg
							>
						</div>
						Usuarios
					</a>

					<!-- Pedidos Link -->
					<a
						href="/admin/pedidos"
						class="flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 group
                       {isActive('/admin/pedidos')
							? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40'
							: 'text-gray-400 hover:text-white hover:bg-white/10'}"
					>
						<div
							class="p-1.5 rounded-lg transition-colors {isActive('/admin/pedidos')
								? 'bg-white/20'
								: 'bg-[#1a2035] group-hover:bg-blue-500/20'}"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								></path></svg
							>
						</div>
						Pedidos
					</a>

					<!-- Envíos Link (NUEVO - Icono Camión) -->
					<a
						href="/admin/envios"
						class="flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 group {isActive(
							'/admin/envios'
						)
							? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40'
							: 'text-gray-400 hover:text-white hover:bg-white/10'}"
					>
						<div
							class="p-1.5 rounded-lg transition-colors {isActive('/admin/envios')
								? 'bg-white/20'
								: 'bg-[#1a2035] group-hover:bg-blue-500/20'}"
						>
							<!-- Icono Camión -->
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
								></path><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 012-2v0m2 0a2 2 0 012 2v0m2 0a2 2 0 012 2v0"
								></path></svg
							>
						</div>
						Envíos
					</a>

					<p
						class="text-[10px] font-bold text-gray-400 uppercase ml-3 mb-2 tracking-wider opacity-80"
					>
						Otros
					</p>

					<!-- Productos Link (Icono Caja) -->
					<a
						href="/tienda"
						class="flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 group {isActive(
							'/tienda'
						)
							? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40'
							: 'text-gray-400 hover:text-white hover:bg-white/10'}"
					>
						<div
							class="p-1.5 rounded-lg transition-colors {isActive('/tienda')
								? 'bg-white/20'
								: 'bg-[#1a2035] group-hover:bg-blue-500/20'}"
						>
							<!-- Icono Caja -->
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
								/></svg
							>
						</div>
						Productos
					</a>
				</nav>

				<!-- Profile / Footer -->
				<div class="flex-none p-4 relative z-10 mt-auto">
					<div
						class="relative bg-gradient-to-br from-[#060b28] to-[#1a2035] rounded-2xl p-4 border border-white/10 shadow-lg group hover:border-blue-500/50 transition-all duration-300"
					>
						<!-- BOTÓN CONFIGURACIÓN (Mejorado) -->
						<!-- hover:scale-110, hover:shadow-blue-500/50 -->
						<div
							class="absolute -top-3 left-4 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg border border-white/20 cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-blue-500/50 hover:bg-blue-500 hover:rotate-90"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="w-4 h-4 text-white"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<circle cx="12" cy="12" r="3"></circle>
								<path
									d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
								></path>
							</svg>
						</div>

						<div class="mt-3">
							<p class="text-[10px] text-gray-500 font-bold uppercase mb-1">Conectado como:</p>
							<h4 class="text-white font-bold text-sm truncate">{usuario.nombre}</h4>

							<!-- BOTÓN CERRAR SESIÓN (Mejorado) -->
							<!-- hover:scale-105, hover:shadow-red-500/20, hover:text-red-300 -->
							<button
								on:click={handleLogout}
								class="mt-3 w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold uppercase transition-all duration-200 border border-red-500/20 flex items-center justify-center gap-2 group-hover:bg-red-500/20 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20 hover:text-red-300"
							>
								<span>Cerrar Sesión</span>
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
									/></svg
								>
							</button>
						</div>
					</div>
				</div>
			</div>
		</aside>

		<!-- Main Content Area -->
		<!-- relative z-10 para que esté por encima del fondo -->
		<main class="flex-1 ml-72 p-8 transition-all duration-300 relative z-10">
			<!-- Breadcrumb Navbar -->
			<div
				class="mb-8 flex justify-between items-center bg-[#0f172a]/40 backdrop-blur-md p-3 rounded-xl border border-white/5 shadow-sm"
			>
				<div>
					<p class="text-sm text-gray-400">
						Páginas / <span class="text-white capitalize"
							>{$page.url.pathname.split('/').pop()}</span
						>
					</p>
					<h2 class="text-xl font-bold text-white capitalize mt-1">
						{$page.url.pathname.split('/').pop()}
					</h2>
				</div>

				<!-- Barra derecha del navbar (Opcional: Notificaciones, etc) -->
				<div class="flex items-center gap-4">
					<div
						class="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold border border-white/20"
					>
						{usuario.nombre.charAt(0).toUpperCase()}
					</div>
				</div>
			</div>

			<slot />
		</main>
	</div>
{/if}
