<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { onMount } from 'svelte';

	// --- INTERFACES ---
	interface Category {
		id: number;
		nombre: string;
		descripcion: string;
		imagen: string;
	}

	interface Product {
		id: number;
		nombre: string;
		precio: number;
		stock: number;
		idCategoria: number;
		categoriaNombre?: string;
		estado: string;
		imagen: string;
	}

	// --- ESTADO GLOBAL ---
	let showCategories = true;
	let showProducts = true;

	// Datos
	let categories: Category[] = [];
	let products: Product[] = [];

	// Filtros
	let searchCategory = '';
	let searchProduct = '';
	let filterStatus = 'Todos';

	// Selección masiva
	let selectedCategories: number[] = [];
	let selectedProducts: number[] = [];

	// --- ESTADO DE MODALES ---
	let showModalCategory = false;
	let showModalProduct = false;
	let isEditing = false;

	// Formularios
	let formCategory: Category = { id: 0, nombre: '', descripcion: '', imagen: '' };
	let formProduct: Product = {
		id: 0,
		nombre: '',
		precio: 0,
		stock: 0,
		idCategoria: 1,
		estado: 'Activo',
		imagen: ''
	};

	// --- ERRORES DE VALIDACIÓN (Categoría) ---
	let catNameError = '';
	let catDescError = '';
	let catImgError = '';

	// --- ERRORES DE VALIDACIÓN (Producto) ---
	let prodNameError = '';
	let prodPriceError = '';
	let prodStockError = '';
	let prodImgError = '';

	// --- INICIALIZACIÓN ---
	onMount(async () => {
		await fetchCategories();
		await fetchProducts();
	});

	// --- VALIDACIONES LÓGICA ---

	// Validador de Texto Mejorado
	// allowSpaces = true: Permite espacios entre palabras
	function validateText(
		val: string,
		fieldName: string,
		min: number,
		max: number,
		allowSpaces: boolean = false
	) {
		if (!val) return `El ${fieldName} es obligatorio.`;

		// Validamos longitud sobre el texto limpio
		const trimmed = val.trim();
		if (trimmed.length < min) return `Mínimo ${min} caracteres.`;
		if (trimmed.length > max) return `Máximo ${max} caracteres.`;

		// Regla: No espacios (solo si allowSpaces es false)
		if (!allowSpaces && /\s/.test(val)) return `No se permiten espacios.`;

		// Regla: No números
		if (/[0-9]/.test(val)) return `No se permiten números.`;

		// Regla: Solo letras estándar (Español) y espacios si está permitido
		const regex = allowSpaces ? /^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/ : /^[a-zA-ZñÑáéíóúÁÉÍÓÚ]+$/;

		if (!regex.test(trimmed)) {
			return `No se permiten caracteres especiales${allowSpaces ? '' : ', espacios'} ni de otro idioma.`;
		}
		return '';
	}

	// Validador de URL de Imagen
	function validateImageUrl(url: string) {
		if (!url) return 'La URL es obligatoria.';
		if (!url.startsWith('https://')) return 'Debe comenzar con https://';

		// Regex para extensiones de imagen comunes
		const imageRegex = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
		if (!imageRegex.test(url)) {
			return 'Debe terminar en una extensión de imagen válida (.jpg, .png, etc).';
		}
		return '';
	}

	// Validador de Números (Precio/Stock)
	function validateNumber(val: number, fieldName: string) {
		if (val === null || val === undefined) return 'Campo obligatorio.';
		if (val <= 0) return `${fieldName} debe ser mayor a 0.`;
		if (val > 999999999) return `${fieldName} excede el máximo permitido.`;
		return '';
	}

	// --- HANDLERS VALIDACIÓN CATEGORÍA ---
	function validateCategoryForm() {
		// Nombre Categoría: Sin espacios (mantenido estricto)
		catNameError = validateText(formCategory.nombre, 'nombre', 3, 16, false);
		// Descripción Categoría: CON ESPACIOS PERMITIDOS
		catDescError = validateText(formCategory.descripcion, 'descripción', 3, 64, true);
		catImgError = validateImageUrl(formCategory.imagen);
	}

	// --- HANDLERS VALIDACIÓN PRODUCTO ---
	function validateProductForm() {
		// Nombre Producto: CON ESPACIOS PERMITIDOS
		prodNameError = validateText(formProduct.nombre, 'nombre', 3, 32, true); // Aumenté un poco el max a 32 para nombres con espacios
		prodPriceError = validateNumber(formProduct.precio, 'Precio');
		prodStockError = validateNumber(formProduct.stock, 'Stock');
		prodImgError = validateImageUrl(formProduct.imagen);
	}

	// Helpers para habilitar botones
	$: isCategoryValid =
		!catNameError &&
		!catDescError &&
		!catImgError &&
		formCategory.nombre &&
		formCategory.descripcion &&
		formCategory.imagen;
	$: isProductValid =
		!prodNameError &&
		!prodPriceError &&
		!prodStockError &&
		!prodImgError &&
		formProduct.nombre &&
		formProduct.precio > 0 &&
		formProduct.stock > 0 &&
		formProduct.imagen;

	// --- API CALLS: LECTURA ---
	async function fetchCategories() {
		try {
			const res = await fetch('http://localhost:4000/api/categorias');
			if (res.ok) categories = await res.json();
		} catch (e) {
			console.error(e);
		}
	}

	async function fetchProducts() {
		try {
			const res = await fetch('http://localhost:4000/api/productos');
			if (res.ok) products = await res.json();
		} catch (e) {
			console.error(e);
		}
	}

	// --- MANEJO DE ERRORES IMAGEN ---
	function handleImageError(e: Event) {
		const target = e.target as HTMLImageElement;
		target.onerror = null;
		target.src =
			'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMTUwIDE1MCI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiMxZTI1NDgiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5NDVhNzQiPlNpbiBJbWFnZW48L3RleHQ+PC9zdmc+';
	}

	// --- ACCIONES CATEGORÍAS ---
	function openCreateCategory() {
		isEditing = false;
		formCategory = { id: 0, nombre: '', descripcion: '', imagen: '' };
		// Reset errores
		catNameError = '';
		catDescError = '';
		catImgError = '';
		showModalCategory = true;
	}

	function openEditCategory(cat: Category) {
		isEditing = true;
		formCategory = { ...cat };
		validateCategoryForm();
		showModalCategory = true;
	}

	async function saveCategory() {
		validateCategoryForm();
		if (!isCategoryValid) return;

		const method = isEditing ? 'PUT' : 'POST';
		const url = isEditing
			? `http://localhost:4000/api/categorias/${formCategory.id}`
			: `http://localhost:4000/api/categorias`;

		// LIMPIEZA: Trim antes de enviar
		const payload = {
			...formCategory,
			nombre: formCategory.nombre.trim(),
			descripcion: formCategory.descripcion.trim()
		};

		try {
			await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			showModalCategory = false;
			await fetchCategories();
		} catch (e) {
			alert('Error al guardar categoría');
		}
	}

	// --- ACCIONES PRODUCTOS ---
	function openCreateProduct() {
		isEditing = false;
		const defaultCat = categories.length > 0 ? categories[0].id : 1;
		formProduct = {
			id: 0,
			nombre: '',
			precio: 0,
			stock: 0,
			idCategoria: defaultCat,
			estado: 'Activo',
			imagen: ''
		};
		// Reset errores
		prodNameError = '';
		prodPriceError = '';
		prodStockError = '';
		prodImgError = '';
		showModalProduct = true;
	}

	function openEditProduct(prod: Product) {
		isEditing = true;
		const catId =
			categories.find((c) => c.nombre === prod.categoriaNombre)?.id || prod.idCategoria || 1;
		formProduct = { ...prod, idCategoria: catId };
		validateProductForm();
		showModalProduct = true;
	}

	async function saveProduct() {
		validateProductForm();
		if (!isProductValid) return;

		const method = isEditing ? 'PUT' : 'POST';
		const url = isEditing
			? `http://localhost:4000/api/productos/${formProduct.id}`
			: `http://localhost:4000/api/productos`;

		// LIMPIEZA: Trim antes de enviar
		const payload = {
			...formProduct,
			nombre: formProduct.nombre.trim()
		};

		try {
			await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			showModalProduct = false;
			await fetchProducts();
		} catch (e) {
			alert('Error al guardar producto');
		}
	}

	// --- ELIMINAR ---
	async function handleDeleteCategory(id: number) {
		if (!confirm('¿Eliminar esta categoría?')) return;
		try {
			await fetch(`http://localhost:4000/api/categorias/${id}`, { method: 'DELETE' });
			await fetchCategories();
			selectedCategories = selectedCategories.filter((cid) => cid !== id);
		} catch (e) {
			alert('Error al eliminar');
		}
	}

	async function handleDeleteBulkCategories() {
		if (!confirm(`¿Eliminar ${selectedCategories.length} categorías?`)) return;
		for (const id of selectedCategories) {
			await fetch(`http://localhost:4000/api/categorias/${id}`, { method: 'DELETE' });
		}
		await fetchCategories();
		selectedCategories = [];
	}

	async function handleDeleteProduct(id: number) {
		if (!confirm('¿Eliminar este producto?')) return;
		try {
			await fetch(`http://localhost:4000/api/productos/${id}`, { method: 'DELETE' });
			products = products.filter((p) => p.id !== id);
			selectedProducts = selectedProducts.filter((pid) => pid !== id);
		} catch (e) {
			alert('Error al eliminar');
		}
	}

	async function handleDeleteBulkProducts() {
		if (!confirm(`¿Eliminar ${selectedProducts.length} productos?`)) return;
		for (const id of selectedProducts) {
			await fetch(`http://localhost:4000/api/productos/${id}`, { method: 'DELETE' });
		}
		await fetchProducts();
		selectedProducts = [];
	}

	// --- FILTROS Y SELECTORES (Igual que antes) ---
	$: filteredCategories = categories.filter((c) =>
		c.nombre.toLowerCase().includes(searchCategory.toLowerCase())
	);
	$: filteredProducts = products.filter((p) => {
		const term = searchProduct.toLowerCase();
		const matchesSearch =
			(p.nombre || '').toLowerCase().includes(term) || (p.id || '').toString().includes(term);
		const matchesStatus = filterStatus === 'Todos' || p.estado === filterStatus;
		return matchesSearch && matchesStatus;
	});

	function toggleSelectCategory(id: number) {
		if (selectedCategories.includes(id))
			selectedCategories = selectedCategories.filter((cid) => cid !== id);
		else selectedCategories = [...selectedCategories, id];
	}
	function toggleSelectAllCategories() {
		selectedCategories =
			selectedCategories.length === filteredCategories.length
				? []
				: filteredCategories.map((c) => c.id);
	}
	function toggleSelectProduct(id: number) {
		if (selectedProducts.includes(id))
			selectedProducts = selectedProducts.filter((pid) => pid !== id);
		else selectedProducts = [...selectedProducts, id];
	}
	function toggleSelectAllProducts() {
		selectedProducts =
			selectedProducts.length === filteredProducts.length ? [] : filteredProducts.map((p) => p.id);
	}

	// --- PAGINACIÓN ---
	let itemsPerPageCat = 5;
	let currentPageCat = 1;
	let itemsPerPageProd = 5;
	let currentPageProd = 1;

	$: paginatedCategories = filteredCategories.slice(
		(currentPageCat - 1) * itemsPerPageCat,
		currentPageCat * itemsPerPageCat
	);
	$: paginatedProducts = filteredProducts.slice(
		(currentPageProd - 1) * itemsPerPageProd,
		currentPageProd * itemsPerPageProd
	);

	function changePageCat(newPage: number) {
		currentPageCat = newPage;
	}
	function changePageProd(newPage: number) {
		currentPageProd = newPage;
	}
</script>

<div class="flex flex-col gap-8 pb-10 w-full text-white">
	<!-- SECCIÓN 1: CATEGORÍAS -->
	<section
		class="bg-[#0f172a]/70 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-lg overflow-hidden flex flex-col transition-all duration-300"
	>
		<div class="p-5 flex flex-col md:flex-row justify-between items-center gap-4">
			<div class="flex items-center gap-4 w-full md:w-auto">
				<button
					on:click={() => (showCategories = !showCategories)}
					class="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
				>
					<svg
						class="w-5 h-5 transform transition-transform {showCategories
							? 'rotate-180'
							: 'rotate-0'}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 9l-7 7-7-7"
						></path></svg
					>
				</button>
				<div>
					<h2 class="text-lg font-bold text-white">Categorías</h2>
					<p class="text-xs text-gray-400">Gestiona las agrupaciones</p>
				</div>
			</div>
			<div class="flex items-center gap-3 w-full md:w-auto">
				{#if selectedCategories.length > 0}
					<button
						on:click={handleDeleteBulkCategories}
						transition:fade
						class="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-red-500 hover:text-white transition-all"
						>Borrar ({selectedCategories.length})</button
					>
				{/if}
				<input
					type="text"
					bind:value={searchCategory}
					placeholder="Buscar..."
					class="bg-[#0b1437] text-gray-300 text-sm rounded-xl px-4 py-2 border border-white/10 focus:border-blue-500 outline-none w-full md:w-48"
				/>
				<button
					on:click={openCreateCategory}
					class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase shadow-lg shadow-blue-500/30 whitespace-nowrap"
					>+ Crear</button
				>
			</div>
		</div>

		{#if showCategories}
			<div transition:slide class="border-t border-white/5 overflow-x-auto">
				<table class="w-full">
					<thead class="bg-[#0b1437]/30 text-left">
						<tr>
							<th class="p-4 w-10"
								><input
									type="checkbox"
									on:change={toggleSelectAllCategories}
									class="rounded bg-gray-700 border-gray-600 text-blue-600 cursor-pointer"
								/></th
							>
							<th class="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider"
								>Categoría</th
							>
							<th class="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider"
								>Descripción</th
							>
							<th
								class="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right"
								>Acciones</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-white/5">
						{#each paginatedCategories as cat}
							<tr class="hover:bg-white/5 transition-colors group">
								<td class="p-4"
									><input
										type="checkbox"
										checked={selectedCategories.includes(cat.id)}
										on:change={() => toggleSelectCategory(cat.id)}
										class="rounded bg-gray-700 border-gray-600 text-blue-600 cursor-pointer"
									/></td
								>
								<td class="p-4">
									<div class="flex items-center gap-3">
										<div
											class="w-10 h-10 rounded-lg overflow-hidden border border-white/10 bg-black"
										>
											<img
												src={cat.imagen}
												alt={cat.nombre}
												class="w-full h-full object-cover"
												on:error={handleImageError}
											/>
										</div>
										<div>
											<div class="text-sm font-bold text-white">{cat.nombre}</div>
											<div class="text-[10px] text-gray-500 font-mono">ID: {cat.id}</div>
										</div>
									</div>
								</td>
								<td class="p-4 text-xs text-gray-400 truncate max-w-xs">{cat.descripcion}</td>
								<td class="p-4 text-right">
									<div class="flex items-center justify-end gap-2">
										<button
											on:click={() => openEditCategory(cat)}
											class="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
											><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
												><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
												></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
												></path></svg
											></button
										>
										<button
											on:click={() => handleDeleteCategory(cat.id)}
											class="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
											><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
												><polyline points="3 6 5 6 21 6"></polyline><path
													d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
												></path></svg
											></button
										>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div
				class="p-4 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400"
			>
				<div class="flex items-center gap-2">
					<!-- Selector de filas por página (Opcional, usando estilo Vision UI de envíos si quieres) -->
					<span>Filas:</span>
					<select
						bind:value={itemsPerPageCat}
						class="bg-[#0b1437] border border-white/10 rounded-lg px-2 py-1 outline-none focus:border-blue-500 cursor-pointer appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyMCAyMCIgc3Ryb2tlPSJ3aGl0ZSI+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9IjEuNSIgZD0iTTYgOGw0IDQgNC00Ii8+PC9zdmc+')] bg-no-repeat bg-[center_right_0.5rem] pr-8"
					>
						<option value={5} class="text-gray-900 bg-white">5</option>
						<option value={10} class="text-gray-900 bg-white">10</option>
						<option value={20} class="text-gray-900 bg-white">20</option>
					</select>
				</div>
				<div class="flex gap-2">
					<button
						on:click={() => changePageCat(Math.max(1, currentPageCat - 1))}
						class="px-2 bg-[#0b1437] rounded border border-white/10">Prev</button
					>
					<span>Pag {currentPageCat}</span>
					<button
						on:click={() => changePageCat(currentPageCat + 1)}
						class="px-2 bg-[#0b1437] rounded border border-white/10">Next</button
					>
				</div>
			</div>
		{/if}
	</section>

	<!-- SECCIÓN 2: PRODUCTOS -->
	<section
		class="bg-[#0f172a]/70 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-lg overflow-hidden flex flex-col transition-all duration-300"
	>
		<div class="p-5 flex flex-col gap-4">
			<div class="flex justify-between items-center">
				<div class="flex items-center gap-4">
					<button
						on:click={() => (showProducts = !showProducts)}
						class="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
					>
						<svg
							class="w-5 h-5 transform transition-transform {showProducts
								? 'rotate-180'
								: 'rotate-0'}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 9l-7 7-7-7"
							></path></svg
						>
					</button>
					<div>
						<h2 class="text-xl font-bold text-white">Productos</h2>
						<span
							class="inline-flex items-center justify-center px-2 py-0.5 ml-2 text-xs font-bold leading-none text-blue-100 bg-blue-600 rounded-full"
							>{filteredProducts.length}</span
						>
					</div>
				</div>
				<div class="flex items-center gap-3">
					{#if selectedProducts.length > 0}
						<button
							on:click={handleDeleteBulkProducts}
							transition:fade
							class="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-red-500 hover:text-white transition-all"
							>Eliminar ({selectedProducts.length})</button
						>
					{/if}
					<button
						on:click={openCreateProduct}
						class="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase shadow-lg shadow-blue-500/30 flex items-center gap-2"
					>
						Agregar
					</button>
				</div>
			</div>

			{#if showProducts}
				<div
					transition:slide
					class="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-white/5"
				>
					<div class="md:col-span-2 relative">
						<input
							type="text"
							bind:value={searchProduct}
							placeholder="Buscar producto..."
							class="w-full bg-[#0b1437] text-white text-sm rounded-xl pl-4 pr-4 py-2.5 border border-white/10 focus:border-blue-500 outline-none"
						/>
					</div>
					<div class="relative">
						<select
							bind:value={filterStatus}
							class="w-full bg-[#0b1437] text-white text-sm rounded-xl px-4 py-2.5 border border-white/10 focus:border-blue-500 outline-none appearance-none cursor-pointer bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyMCAyMCIgc3Ryb2tlPSJ3aGl0ZSI+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9IjEuNSIgZD0iTTYgOGw0IDQgNC00Ii8+PC9zdmc+')] bg-no-repeat bg-[center_right_0.75rem]"
						>
							<option value="Todos" class="text-gray-900 bg-white">Todos los Estados</option>
							<option value="Activo" class="text-gray-900 bg-white">Activos</option>
							<option value="Agotado" class="text-gray-900 bg-white">Agotados</option>
							<option value="Inactivo" class="text-gray-900 bg-white">Inactivos</option>
						</select>
					</div>
				</div>
			{/if}
		</div>

		{#if showProducts}
			<div transition:slide class="border-t border-white/5 overflow-x-auto min-h-[400px]">
				<table class="w-full">
					<thead class="bg-[#0b1437]/30 text-left">
						<tr>
							<th class="p-4 w-10"
								><input
									type="checkbox"
									on:change={toggleSelectAllProducts}
									class="rounded bg-gray-700 border-gray-600 text-blue-600 w-4 h-4 cursor-pointer"
								/></th
							>
							<th class="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider"
								>Producto</th
							>
							<th class="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider"
								>Precio</th
							>
							<th class="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider"
								>Categoría</th
							>
							<th
								class="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center"
								>Stock</th
							>
							<th
								class="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center"
								>Estado</th
							>
							<th
								class="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right"
								>Acciones</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-white/5">
						{#each paginatedProducts as prod}
							<tr class="hover:bg-white/5 transition-colors group">
								<td class="p-4"
									><input
										type="checkbox"
										checked={selectedProducts.includes(prod.id)}
										on:change={() => toggleSelectProduct(prod.id)}
										class="rounded bg-gray-700 border-gray-600 text-blue-600 w-4 h-4 cursor-pointer"
									/></td
								>
								<td class="p-4">
									<div class="flex items-center gap-3">
										<div
											class="w-10 h-10 rounded-lg overflow-hidden border border-white/10 bg-black flex-shrink-0"
										>
											<img
												src={prod.imagen}
												alt={prod.nombre}
												class="w-full h-full object-cover"
												on:error={handleImageError}
											/>
										</div>
										<div>
											<div class="text-sm font-bold text-white">{prod.nombre}</div>
											<div class="text-[10px] text-gray-500 font-mono">#{prod.id}</div>
										</div>
									</div>
								</td>
								<td class="p-4 text-xs font-bold text-white">S/.{Number(prod.precio).toFixed(2)}</td
								>
								<td class="p-4"
									><span
										class="text-xs text-gray-300 bg-white/5 px-2 py-1 rounded-md border border-white/5"
										>{prod.categoriaNombre || 'N/A'}</span
									></td
								>
								<td class="p-4 text-center">
									<span
										class="text-xs font-bold {prod.stock < 20 ? 'text-red-400' : 'text-blue-400'}"
										>{prod.stock} ud.</span
									>
								</td>
								<td class="p-4 text-center">
									<span
										class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full {prod.estado ===
										'Activo'
											? 'bg-green-500/20 text-green-400'
											: 'bg-gray-500/20 text-gray-400'}">{prod.estado}</span
									>
								</td>
								<td class="p-4 text-right">
									<div class="flex items-center justify-end gap-2">
										<button
											on:click={() => openEditProduct(prod)}
											class="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 hover:bg-blue-500/20 hover:text-blue-400 text-gray-400 transition-all"
											><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
												><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
												></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
												></path></svg
											></button
										>
										<button
											on:click={() => handleDeleteProduct(prod.id)}
											class="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 hover:bg-red-500/20 hover:text-red-400 text-gray-400 transition-all"
											><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
												><polyline points="3 6 5 6 21 6"></polyline><path
													d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
												></path></svg
											></button
										>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div
				class="p-4 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400"
			>
				<div class="flex items-center gap-2">
					<span>Filas:</span>
					<select
						bind:value={itemsPerPageProd}
						class="bg-[#0b1437] border border-white/10 rounded-lg px-2 py-1 outline-none focus:border-blue-500 cursor-pointer appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyMCAyMCIgc3Ryb2tlPSJ3aGl0ZSI+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9IjEuNSIgZD0iTTYgOGw0IDQgNC00Ii8+PC9zdmc+')] bg-no-repeat bg-[center_right_0.5rem] pr-8"
					>
						<option value={5} class="text-gray-900 bg-white">5</option>
						<option value={10} class="text-gray-900 bg-white">10</option>
						<option value={20} class="text-gray-900 bg-white">20</option>
					</select>
				</div>
				<div class="flex gap-2">
					<button
						on:click={() => changePageProd(Math.max(1, currentPageProd - 1))}
						class="px-2 bg-[#0b1437] rounded border border-white/10">Prev</button
					>
					<span>Pag {currentPageProd}</span>
					<button
						on:click={() => changePageProd(currentPageProd + 1)}
						class="px-2 bg-[#0b1437] rounded border border-white/10">Next</button
					>
				</div>
			</div>
		{/if}
	</section>
</div>

<!-- MODAL CATEGORÍA (VALIDADO) -->
{#if showModalCategory}
	<div
		transition:fade
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
	>
		<div
			class="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden"
		>
			<div class="p-6 border-b border-white/10 flex justify-between items-center bg-[#0b1437]/30">
				<h3 class="text-xl font-bold text-white">{isEditing ? 'Editar' : 'Crear'} Categoría</h3>
				<button on:click={() => (showModalCategory = false)} class="text-gray-400 hover:text-white"
					>✕</button
				>
			</div>
			<div class="p-6 space-y-4">
				<!-- NOMBRE -->
				<div>
					<label class="block text-xs font-bold text-gray-400 uppercase mb-2"
						>Nombre (Sin espacios/símbolos)</label
					>
					<input
						type="text"
						bind:value={formCategory.nombre}
						on:input={validateCategoryForm}
						class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {catNameError
							? 'border-red-500'
							: 'border-white/10'} focus:border-blue-500 outline-none"
					/>
					{#if catNameError}<p class="text-red-400 text-xs mt-1">{catNameError}</p>{/if}
				</div>
				<!-- DESCRIPCIÓN -->
				<div>
					<label class="block text-xs font-bold text-gray-400 uppercase mb-2"
						>Descripción (Espacios permitidos)</label
					>
					<textarea
						bind:value={formCategory.descripcion}
						on:input={validateCategoryForm}
						rows="3"
						class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {catDescError
							? 'border-red-500'
							: 'border-white/10'} focus:border-blue-500 outline-none"
					></textarea>
					{#if catDescError}<p class="text-red-400 text-xs mt-1">{catDescError}</p>{/if}
				</div>
				<!-- URL -->
				<div>
					<label class="block text-xs font-bold text-gray-400 uppercase mb-2">URL Imagen</label>
					<input
						type="url"
						bind:value={formCategory.imagen}
						on:input={validateCategoryForm}
						class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {catImgError
							? 'border-red-500'
							: 'border-white/10'} focus:border-blue-500 outline-none"
					/>
					{#if catImgError}<p class="text-red-400 text-xs mt-1">{catImgError}</p>{/if}
				</div>
			</div>
			<div class="p-6 border-t border-white/10 flex justify-end gap-3 bg-[#0b1437]/30">
				<button
					on:click={() => (showModalCategory = false)}
					class="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition"
					>Cancelar</button
				>
				<button
					on:click={saveCategory}
					disabled={!isCategoryValid}
					class="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
					>Guardar</button
				>
			</div>
		</div>
	</div>
{/if}

<!-- MODAL PRODUCTO (VALIDADO) -->
{#if showModalProduct}
	<div
		transition:fade
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
	>
		<div
			class="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden"
		>
			<div class="p-6 border-b border-white/10 flex justify-between items-center bg-[#0b1437]/30">
				<h3 class="text-xl font-bold text-white">{isEditing ? 'Editar' : 'Crear'} Producto</h3>
				<button on:click={() => (showModalProduct = false)} class="text-gray-400 hover:text-white"
					>✕</button
				>
			</div>
			<div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
				<!-- NOMBRE -->
				<div class="col-span-2">
					<label class="block text-xs font-bold text-gray-400 uppercase mb-2"
						>Nombre (Espacios permitidos)</label
					>
					<input
						type="text"
						bind:value={formProduct.nombre}
						on:input={validateProductForm}
						class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {prodNameError
							? 'border-red-500'
							: 'border-white/10'} focus:border-blue-500 outline-none"
					/>
					{#if prodNameError}<p class="text-red-400 text-xs mt-1">{prodNameError}</p>{/if}
				</div>
				<!-- PRECIO -->
				<div>
					<label class="block text-xs font-bold text-gray-400 uppercase mb-2">Precio</label>
					<input
						type="number"
						step="0.01"
						bind:value={formProduct.precio}
						on:input={validateProductForm}
						class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {prodPriceError
							? 'border-red-500'
							: 'border-white/10'} focus:border-blue-500 outline-none"
					/>
					{#if prodPriceError}<p class="text-red-400 text-xs mt-1">{prodPriceError}</p>{/if}
				</div>
				<!-- STOCK -->
				<div>
					<label class="block text-xs font-bold text-gray-400 uppercase mb-2">Stock</label>
					<input
						type="number"
						bind:value={formProduct.stock}
						on:input={validateProductForm}
						class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {prodStockError
							? 'border-red-500'
							: 'border-white/10'} focus:border-blue-500 outline-none"
					/>
					{#if prodStockError}<p class="text-red-400 text-xs mt-1">{prodStockError}</p>{/if}
				</div>
				<!-- CATEGORÍA -->
				<div>
					<label class="block text-xs font-bold text-gray-400 uppercase mb-2">Categoría</label>
					<div class="relative">
						<select
							bind:value={formProduct.idCategoria}
							class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border border-white/10 focus:border-blue-500 outline-none appearance-none cursor-pointer bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyMCAyMCIgc3Ryb2tlPSJ3aGl0ZSI+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9IjEuNSIgZD0iTTYgOGw0IDQgNC00Ii8+PC9zdmc+')] bg-no-repeat bg-[center_right_0.75rem]"
						>
							{#each categories as cat}
								<option value={cat.id} class="text-gray-900 bg-white">{cat.nombre}</option>
							{/each}
						</select>
					</div>
				</div>
				<!-- ESTADO -->
				<div>
					<label class="block text-xs font-bold text-gray-400 uppercase mb-2">Estado</label>
					<div class="relative">
						<select
							bind:value={formProduct.estado}
							class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border border-white/10 focus:border-blue-500 outline-none appearance-none cursor-pointer bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyMCAyMCIgc3Ryb2tlPSJ3aGl0ZSI+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9IjEuNSIgZD0iTTYgOGw0IDQgNC00Ii8+PC9zdmc+')] bg-no-repeat bg-[center_right_0.75rem]"
						>
							<option value="Activo" class="text-gray-900 bg-white">Activo</option>
							<option value="Agotado" class="text-gray-900 bg-white">Agotado</option>
							<option value="Inactivo" class="text-gray-900 bg-white">Inactivo</option>
						</select>
					</div>
				</div>
				<!-- IMAGEN -->
				<div class="col-span-2">
					<label class="block text-xs font-bold text-gray-400 uppercase mb-2">URL Imagen</label>
					<input
						type="url"
						bind:value={formProduct.imagen}
						on:input={validateProductForm}
						class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {prodImgError
							? 'border-red-500'
							: 'border-white/10'} focus:border-blue-500 outline-none"
					/>
					{#if prodImgError}<p class="text-red-400 text-xs mt-1">{prodImgError}</p>{/if}
				</div>
			</div>
			<div class="p-6 border-t border-white/10 flex justify-end gap-3 bg-[#0b1437]/30">
				<button
					on:click={() => (showModalProduct = false)}
					class="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition"
					>Cancelar</button
				>
				<button
					on:click={saveProduct}
					disabled={!isProductValid}
					class="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
					>Guardar</button
				>
			</div>
		</div>
	</div>
{/if}
