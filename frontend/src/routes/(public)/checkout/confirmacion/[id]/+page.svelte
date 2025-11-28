<script lang="ts">
	import { page } from '$app/stores';
	import { fade, scale } from 'svelte/transition';

	// Obtenemos el ID del pedido desde la URL (/[id])
	$: orderId = $page.params.id;
</script>

<div class="min-h-screen flex items-center justify-center px-4 relative overflow-hidden pt-20">
	<!-- Fondo Vision UI -->
	<div class="fixed inset-0 bg-[#0f172a] -z-20"></div>

	<!-- Luces ambientales (Centradas para celebrar) -->
	<div
		class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/20 rounded-full blur-[150px] pointer-events-none -z-10 animate-pulse"
	></div>

	<div
		class="max-w-lg w-full bg-[#0f172a]/70 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 shadow-[0_20px_50px_rgba(0,255,100,0.1)] text-center relative overflow-hidden"
		in:fade
	>
		<!-- Efecto de confeti sutil (círculos decorativos) -->
		<div
			class="absolute top-[-10%] left-[-10%] w-32 h-32 bg-green-400/10 rounded-full blur-2xl"
		></div>
		<div
			class="absolute bottom-[-10%] right-[-10%] w-32 h-32 bg-blue-400/10 rounded-full blur-2xl"
		></div>

		<!-- Icono de Éxito Animado -->
		<div class="mb-8 flex justify-center">
			<div
				class="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)]"
				in:scale={{ duration: 500, delay: 200 }}
			>
				<svg
					class="w-12 h-12 text-green-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					stroke-width="3"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
				</svg>
			</div>
		</div>

		<h1 class="text-3xl font-bold text-white mb-2">¡Gracias por tu compra!</h1>
		<p class="text-gray-400 mb-8">Tu pedido ha sido procesado exitosamente.</p>

		<div class="bg-[#0b1437] border border-white/10 rounded-xl p-4 mb-8 inline-block">
			<p class="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Número de Orden</p>
			<p class="text-xl font-mono text-blue-400 font-bold">#{orderId}</p>
		</div>

		<p class="text-sm text-gray-500 mb-8 px-4">
			Hemos enviado un correo de confirmación con los detalles de tu pedido y la información de
			seguimiento.
		</p>

		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			<a
				href="/tienda"
				class="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all transform hover:-translate-y-0.5"
			>
				Seguir Comprando
			</a>
			<!-- Este botón funcionará cuando creemos la página de perfil -->
			<!-- <a href="/perfil/pedidos" class="px-6 py-3 rounded-xl bg-transparent border border-white/20 text-white font-bold text-sm hover:bg-white/5 transition-all">
                Ver mis Pedidos
            </a> -->
		</div>
	</div>
</div>
