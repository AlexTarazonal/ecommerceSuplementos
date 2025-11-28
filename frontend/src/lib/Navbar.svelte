<script lang="ts">
	import { onMount } from 'svelte';
	import { cart } from '$lib/cart';

	// 1. SOLUCIÓN AL ERROR DE TYPESCRIPT
	// Definimos qué propiedades tiene un usuario para que TS no se queje
	interface User {
		nombre: string;
		email: string;
		rol: string;
		// Agrega otras propiedades si tu BD retorna más cosas
	}

	// Indicamos que 'usuario' puede ser de tipo User o null
	let usuario: User | null = null;

	onMount(() => {
		const userStored = localStorage.getItem('usuario');
		if (userStored) {
			try {
				usuario = JSON.parse(userStored);
			} catch (e) {
				console.error('Error al leer usuario', e);
			}
		}
	});

	function logout() {
		localStorage.removeItem('token');
		localStorage.removeItem('usuario');
		usuario = null;
		window.location.href = '/login';
	}
</script>

<!-- Navbar con TUS ESTILOS ORIGINALES (vision-card) -->
<nav
	class="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50 px-6 py-4 rounded-2xl border border-white/10 bg-vision-card backdrop-blur-md shadow-lg flex items-center justify-between transition-all duration-300"
>
	<!-- LOGO -->
	<div class="text-xl font-bold tracking-wide text-white">
		NUTRI<span class="text-vision-primary">STORE</span>
	</div>

	<!-- LINKS CENTRALES -->
	<div class="hidden md:flex space-x-8 text-sm font-medium text-gray-300">
		<a href="/" class="hover:text-white transition">Inicio</a>
		<a href="/tienda" class="hover:text-white transition">Productos</a>
		<a href="/nosotros" class="hover:text-white transition">Nosotros</a>
	</div>

	<!-- ZONA DERECHA (Login/Registro o Perfil + Carrito) -->
	<div class="flex items-center gap-4">
		<!-- LÓGICA DE SESIÓN -->
		{#if usuario}
			<!-- SI HAY USUARIO: Muestra Dropdown de Perfil -->
			<div class="relative group">
				<button
					class="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors"
				>
					<div
						class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-lg border border-white/20"
					>
						{usuario.nombre.charAt(0).toUpperCase()}
					</div>
					<span class="text-sm font-bold text-white hidden sm:block">{usuario.nombre}</span>
					<svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 9l-7 7-7-7"
						></path></svg
					>
				</button>

				<!-- Menú Desplegable -->
				<div
					class="absolute right-0 top-full mt-2 w-56 bg-vision-card border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right scale-95 group-hover:scale-100 z-50 backdrop-blur-xl"
				>
					<div class="p-2 flex flex-col gap-1">
						<div class="px-4 py-2 border-b border-white/10 mb-1">
							<p class="text-[10px] text-gray-500 uppercase font-bold">Cuenta</p>
							<p class="text-xs text-white truncate">{usuario.email}</p>
						</div>

						{#if usuario.rol === 'admin'}
							<a
								href="/admin/dashboard"
								class="px-4 py-2 text-xs text-white hover:bg-blue-600 rounded-lg transition-colors flex items-center gap-2"
							>
								<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
									/></svg
								>
								Panel Admin
							</a>
						{/if}

						<!-- NUEVO: Mis Datos -->
						<a
							href="/perfil/datos"
							class="px-4 py-2 text-xs text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
						>
							<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
								></path></svg
							>
							Mis Datos
						</a>

						<!-- NUEVO: Mis Pedidos -->
						<a
							href="/perfil/pedidos"
							class="px-4 py-2 text-xs text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
						>
							<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
								></path></svg
							>
							Mis Pedidos
						</a>

						<div class="border-t border-white/10 my-1"></div>

						<button
							on:click={logout}
							class="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
						>
							<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3h4a3 3 0 01-3 3v1"
								/></svg
							>
							Cerrar Sesión
						</button>
					</div>
				</div>
			</div>
		{:else}
			<!-- SI NO HAY USUARIO: Muestra tus botones originales de Login/Registro -->
			<div class="flex items-center gap-2">
				<a
					href="/login"
					class="px-5 py-2 text-sm font-bold text-white transition-all rounded-xl hover:bg-white/10"
				>
					Ingresar
				</a>
				<a
					href="/register"
					class="px-5 py-2 text-sm font-bold text-white bg-vision-primary rounded-xl shadow-[0_0_20px_rgba(0,117,255,0.4)] hover:shadow-[0_0_30px_rgba(0,117,255,0.6)] transition-all transform hover:-translate-y-0.5"
				>
					Registrarse
				</a>
			</div>
		{/if}

		<!-- CARRITO (Siempre visible al final) -->
		<a href="/carrito" class="relative p-2 text-gray-300 hover:text-white transition group">
			<svg
				class="w-6 h-6 group-hover:scale-110 transition-transform"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
				></path></svg
			>
			{#if $cart.length > 0}
				<span
					class="absolute -top-1 -right-1 bg-vision-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-lg animate-bounce"
				>
					{$cart.length}
				</span>
			{/if}
		</a>
	</div>
</nav>
