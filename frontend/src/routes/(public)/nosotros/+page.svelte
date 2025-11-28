<script>
	import { fade, fly } from 'svelte/transition';
</script>

<div class="min-h-screen pt-32 pb-20 px-4 relative overflow-hidden">
	<!-- Fondo Vision UI (Luces) -->
	<div class="fixed inset-0 bg-[#0f172a] -z-20"></div>
	<div
		class="fixed top-[-10%] left-[-10%] w-[700px] h-[700px] bg-blue-900/20 rounded-full blur-[180px] pointer-events-none -z-10"
	></div>
	<div
		class="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[150px] pointer-events-none -z-10"
	></div>

	<div class="max-w-4xl mx-auto text-center text-white">
		<!-- Título con animación -->
		<div in:fly={{ y: -50, duration: 1000 }}>
			<h1
				class="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
			>
				Sobre Nosotros
			</h1>
			<p class="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
				Bienvenido a <span class="text-white font-bold">SupleStore</span>, tu aliado número uno en
				el camino hacia tu mejor versión.
			</p>
		</div>

		<!-- Tarjetas de Información -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
			<!-- Misión -->
			<div
				class="bg-[#0f172a]/70 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl hover:-translate-y-2 transition-transform duration-500"
				in:fly={{ y: 50, duration: 1000, delay: 200 }}
			>
				<div
					class="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-400"
				>
					<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 10V3L4 14h7v7l9-11h-7z"
						></path></svg
					>
				</div>
				<h3 class="text-xl font-bold mb-3">Nuestra Misión</h3>
				<p class="text-gray-400 text-sm">
					Potenciar el rendimiento de atletas y entusiastas del fitness con suplementos de la más
					alta calidad y pureza garantizada.
				</p>
			</div>

			<!-- Visión -->
			<div
				class="bg-[#0f172a]/70 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl hover:-translate-y-2 transition-transform duration-500"
				in:fly={{ y: 50, duration: 1000, delay: 400 }}
			>
				<div
					class="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-purple-400"
				>
					<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						></path><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
						></path></svg
					>
				</div>
				<h3 class="text-xl font-bold mb-3">Nuestra Visión</h3>
				<p class="text-gray-400 text-sm">
					Ser la tienda referente en suplementación deportiva, inspirando a una comunidad global a
					superar sus propios límites.
				</p>
			</div>

			<!-- Calidad -->
			<div
				class="bg-[#0f172a]/70 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl hover:-translate-y-2 transition-transform duration-500"
				in:fly={{ y: 50, duration: 1000, delay: 600 }}
			>
				<div
					class="w-16 h-16 bg-green-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-green-400"
				>
					<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						></path></svg
					>
				</div>
				<h3 class="text-xl font-bold mb-3">Calidad Premium</h3>
				<p class="text-gray-400 text-sm">
					Seleccionamos rigurosamente cada producto. Solo trabajamos con marcas certificadas que
					cumplen los estándares más altos.
				</p>
			</div>
		</div>

		<!-- Call to Action -->
		<div class="mt-20" in:fade={{ duration: 1500, delay: 800 }}>
			<h2 class="text-3xl font-bold mb-6">¿Listo para empezar?</h2>
			<a
				href="/tienda"
				class="inline-block px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all hover:scale-105"
			>
				Ver Catálogo
			</a>
		</div>
	</div>
</div>
