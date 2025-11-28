<script lang="ts">
	import { cart, removeFromCart, updateQuantity } from '$lib/cart';
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';

	// Calculamos totales en tiempo real
	$: subtotal = $cart.reduce((sum, item) => sum + Number(item.precio) * item.cantidad, 0);
	$: total = subtotal;

	function continuarCheckout() {
		if ($cart.length === 0) return alert('Tu carrito está vacío');
		goto('/checkout/datos');
	}
</script>

<div class="min-h-screen pt-32 pb-20 px-4 relative overflow-hidden">
	<!-- Fondo Vision UI -->
	<div class="fixed inset-0 bg-[#0f172a] -z-20"></div>
	<div
		class="fixed top-[-10%] left-[-10%] w-[700px] h-[700px] bg-blue-900/20 rounded-full blur-[180px] pointer-events-none -z-10"
	></div>
	<div
		class="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[150px] pointer-events-none -z-10"
	></div>

	<div class="max-w-6xl mx-auto">
		<h2 class="text-3xl font-bold text-white mb-8">
			Tu Carrito <span class="text-gray-500 text-lg">({$cart.length} productos)</span>
		</h2>

		{#if $cart.length === 0}
			<div
				class="p-16 text-center bg-[#0f172a]/70 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col items-center justify-center"
				in:fade
			>
				<div
					class="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 text-gray-500"
				>
					<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
						></path></svg
					>
				</div>
				<h3 class="text-xl font-bold text-white mb-2">Tu carrito está vacío</h3>
				<p class="text-gray-400 mb-6">Parece que aún no has añadido suplementos.</p>
				<a
					href="/tienda"
					class="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/30"
				>
					Ir a la Tienda
				</a>
			</div>
		{:else}
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<!-- LISTA DE PRODUCTOS -->
				<div class="lg:col-span-2 space-y-4">
					<div
						class="bg-[#0f172a]/70 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden"
					>
						{#each $cart as item}
							<div
								class="p-5 border-b border-white/5 flex flex-col sm:flex-row gap-5 items-center last:border-0 hover:bg-white/5 transition-colors"
							>
								<!-- Imagen -->
								<div
									class="w-24 h-24 rounded-xl bg-black overflow-hidden border border-white/10 flex-shrink-0 relative"
								>
									<img src={item.imagen} alt={item.nombre} class="w-full h-full object-cover" />
									{#if item.cantidad >= item.stock}
										<div class="absolute inset-0 bg-black/60 flex items-center justify-center">
											<span class="text-[10px] font-bold text-white bg-red-500 px-1 rounded"
												>Max Stock</span
											>
										</div>
									{/if}
								</div>

								<!-- Info -->
								<div class="flex-1 text-center sm:text-left">
									<h3 class="text-white font-bold text-lg">{item.nombre}</h3>
									<p class="text-gray-400 text-sm mb-2">{item.categoriaNombre || 'Suplemento'}</p>
									<p class="text-blue-400 font-bold text-lg">S/.{Number(item.precio).toFixed(2)}</p>
									<p class="text-[10px] text-gray-500 mt-1">Stock disponible: {item.stock}</p>
								</div>

								<!-- Controles de Cantidad -->
								<div class="flex flex-col items-center sm:items-end gap-3">
									<div
										class="flex items-center bg-[#0b1437] border border-white/10 rounded-xl overflow-hidden"
									>
										<!-- Botón Menos -->
										<button
											on:click={() => updateQuantity(item.idProducto, item.cantidad - 1)}
											disabled={item.cantidad <= 1}
											class="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
										>
											-
										</button>

										<!-- Cantidad -->
										<span class="w-10 text-center text-sm font-bold text-white"
											>{item.cantidad}</span
										>

										<!-- Botón Más -->
										<button
											on:click={() => updateQuantity(item.idProducto, item.cantidad + 1)}
											disabled={item.cantidad >= item.stock}
											class="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
										>
											+
										</button>
									</div>

									<button
										on:click={() => removeFromCart(item.idProducto)}
										class="text-red-400 text-xs hover:text-red-300 hover:underline flex items-center gap-1 transition-colors"
									>
										<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											></path></svg
										>
										Eliminar
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- RESUMEN Y ACCIÓN -->
				<div class="lg:col-span-1">
					<div
						class="bg-[#0f172a]/70 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_20px_50px_rgba(8,112,184,0.15)] sticky top-32"
					>
						<h3 class="text-xl font-bold text-white mb-6">Resumen</h3>

						<div class="space-y-3 mb-6">
							<div class="flex justify-between text-gray-400 text-sm">
								<span>Subtotal</span>
								<span>S/.{subtotal.toFixed(2)}</span>
							</div>
							<div class="flex justify-between text-gray-400 text-sm">
								<span>Envío</span>
								<span class="text-gray-500 text-xs italic">(Se calcula en el siguiente paso)</span>
							</div>
						</div>

						<div class="pt-4 border-t border-white/10 flex justify-between items-center mb-6">
							<span class="text-white font-bold text-lg">Total Estimado</span>
							<span class="text-2xl font-bold text-white">S/.{total.toFixed(2)}</span>
						</div>

						<button
							on:click={continuarCheckout}
							class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95 flex justify-center items-center gap-2"
						>
							Procesar Compra
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M14 5l7 7m0 0l-7 7m7-7H3"
								></path></svg
							>
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
