<script>
	import { onMount } from 'svelte';
	import { addToCart } from '$lib/cart';
	import { fade } from 'svelte/transition';

	/**
	 * @typedef {Object} Product
	 * @property {string|number} idProducto
	 * @property {string} nombre
	 * @property {string} imagen
	 * @property {string} categoriaNombre
	 * @property {string} descripcion
	 * @property {number|string} precio
	 * @property {number} stock
	 */

	/** @type {Product[]} */
	let products = [];
	/** @type {string[]} */
	let categories = [];
	let selectedCategory = 'Todas';
	let loading = true;

	onMount(async () => {
		const res = await fetch('http://localhost:4000/api/shop/products');
		if (res.ok) {
			products = await res.json();
			// Extraer categorías únicas
			categories = ['Todas', ...new Set(products.map((p) => p.categoriaNombre))];
		}
		loading = false;
	});

	$: filteredProducts =
		selectedCategory === 'Todas'
			? products
			: products.filter((p) => p.categoriaNombre === selectedCategory);
</script>

<div class="min-h-screen pt-24 pb-12 px-4 sm:px-8 relative overflow-hidden">
	<div
		class="fixed top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"
	></div>
	<div
		class="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"
	></div>

	<div class="relative z-10 text-center mb-12">
		<span class="text-blue-500 font-bold tracking-widest uppercase text-xs">Catálogo 2024</span>
		<h1 class="text-4xl md:text-5xl font-bold text-white mt-2 mb-4">Nuestros Suplementos</h1>
		<p class="text-gray-400 max-w-2xl mx-auto">
			Calidad premium para llevar tu entrenamiento al siguiente nivel.
		</p>
	</div>

	<div class="relative z-10 flex justify-center gap-4 mb-12 flex-wrap">
		{#each categories as cat}
			<button
				on:click={() => (selectedCategory = cat)}
				class="px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 border
                {selectedCategory === cat
					? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]'
					: 'bg-[#0f172a]/60 border-white/10 text-gray-400 hover:text-white hover:border-white/30'}"
			>
				{cat}
			</button>
		{/each}
	</div>

	{#if loading}
		<div class="text-center text-white">Cargando productos...</div>
	{:else}
		<div
			class="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto"
		>
			{#each filteredProducts as product}
				<div
					transition:fade
					class="group bg-[#0f172a]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:border-blue-500/50 hover:shadow-[0_10px_40px_rgba(0,117,255,0.2)] transition-all duration-500 flex flex-col"
				>
					<div class="relative h-48 w-full rounded-xl overflow-hidden bg-black/50 mb-4">
						<img
							src={product.imagen}
							alt={product.nombre}
							class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
						/>
						{#if product.stock < 5}
							<span
								class="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase"
								>¡Últimos!</span
							>
						{/if}
					</div>

					<div class="flex-1">
						<p class="text-blue-400 text-xs font-bold uppercase mb-1">{product.categoriaNombre}</p>
						<h3 class="text-white font-bold text-lg mb-2">{product.nombre}</h3>
						<p class="text-gray-400 text-xs line-clamp-2 mb-4">{product.descripcion}</p>
					</div>

					<div class="flex justify-between items-center mt-auto pt-4 border-t border-white/5">
						<span class="text-2xl font-bold text-white">S/.{Number(product.precio).toFixed(2)}</span
						>
						<button
							on:click={() => addToCart(product)}
							class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 active:scale-95"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 6v6m0 0v6m0-6h6m-6 0H6"
								></path></svg
							>
							Agregar
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
