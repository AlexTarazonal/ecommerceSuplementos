<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	// --- INTERFACES ---
	interface User {
		id: number;
		nombre: string;
		apellido: string;
		email: string;
		telefono: string;
		rol: 'admin' | 'cliente';
		estado: string;
		idEstadoCliente: number;
		fechaRegistro: string;
	}

	// --- ESTADO ---
	let users: User[] = [];
	let isLoading = true;

	// Filtros y Paginación
	let searchText = '';
	let filterRole = 'Todos';
	let currentPage = 1;
	let itemsPerPage = 5;
	let selectedUsers: number[] = [];

	// Modal
	let showModal = false;
	let isEditing = false;

	// Formulario
	let formUser = {
		id: 0,
		nombre: '',
		apellido: '',
		email: '',
		telefono: '',
		rol: 'cliente',
		idEstadoCliente: 1,
		password: ''
	};

	// --- VARIABLES DE ERROR ---
	let nombreError = '';
	let apellidoError = '';
	let emailError = '';
	let telefonoError = '';
	let passwordError = '';

	// --- INICIALIZACIÓN ---
	onMount(async () => {
		await fetchUsers();
	});

	async function fetchUsers() {
		isLoading = true;
		try {
			const res = await fetch('http://localhost:4000/api/usuarios');
			if (res.ok) users = await res.json();
		} catch (error) {
			console.error(error);
		} finally {
			isLoading = false;
		}
	}

	// --- VALIDACIONES (Lógica idéntica al Registro) ---

	function validateText(value: string, fieldName: string) {
		const trimmed = value.trim();
		if (!trimmed) return `El ${fieldName} es obligatorio.`;
		if (trimmed.length < 3) return `Mínimo 3 caracteres.`;
		if (trimmed.length > 16) return `Máximo 16 caracteres.`;
		const textRegex = /^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/;
		if (!textRegex.test(trimmed)) return `No se permiten números ni símbolos.`;
		return '';
	}

	function handleNameInput() {
		nombreError = validateText(formUser.nombre, 'nombre');
	}
	function handleSurnameInput() {
		apellidoError = validateText(formUser.apellido, 'apellido');
	}

	function validateEmail() {
		formUser.email = formUser.email.trim().replace(/\s/g, '');
		const email = formUser.email;

		if (!email) {
			emailError = 'El correo es obligatorio.';
			return;
		}
		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		if (!emailRegex.test(email)) {
			emailError = 'Formato inválido (ej: a@b.co).';
			return;
		}

		const atIndex = email.indexOf('@');
		const localPart = email.substring(0, atIndex);

		if (localPart.length < 3) {
			emailError = 'Mínimo 3 caracteres antes del @.';
			return;
		}
		if (!/[a-zA-Z]/.test(localPart)) {
			emailError = 'Debe contener al menos una letra antes del @.';
			return;
		}
		emailError = '';
	}

	function handlePhoneInput(e: Event) {
		const target = e.target as HTMLInputElement;
		target.value = target.value.replace(/\D/g, '');
		formUser.telefono = target.value;
		validatePhone();
	}

	function validatePhone() {
		const phoneClean = formUser.telefono.trim();
		if (!phoneClean) {
			telefonoError = 'El teléfono es obligatorio.';
			return;
		}
		if (phoneClean.length !== 9) {
			telefonoError = 'Debe tener exactamente 9 dígitos.';
			return;
		}
		telefonoError = '';
	}

	function validatePassword() {
		if (isEditing && !formUser.password) {
			passwordError = ''; // Es opcional al editar
			return;
		}

		formUser.password = formUser.password.trim().replace(/\s/g, '');
		const pass = formUser.password;

		if (!pass) {
			passwordError = 'La contraseña es obligatoria.';
			return;
		}
		if (pass.length < 5) {
			passwordError = 'Mínimo 5 caracteres.';
			return;
		}
		if (pass.length > 16) {
			passwordError = 'Máximo 16 caracteres.';
			return;
		}
		if (!/[a-zA-Z]/.test(pass)) {
			passwordError = 'Debe contener al menos una letra.';
			return;
		}
		if (/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)) {
			passwordError = 'Caracteres no permitidos.';
			return;
		}
		passwordError = '';
	}

	// Helper para deshabilitar botón
	$: isFormValid =
		!nombreError &&
		formUser.nombre &&
		!apellidoError &&
		formUser.apellido &&
		!emailError &&
		formUser.email &&
		!telefonoError &&
		formUser.telefono &&
		!passwordError &&
		(isEditing || formUser.password); // Pass requerido solo al crear

	// --- LÓGICA REACTIVA (Filtros) ---
	$: filteredUsers = users.filter((u) => {
		const term = searchText.toLowerCase();
		const matchText =
			u.nombre.toLowerCase().includes(term) ||
			u.apellido.toLowerCase().includes(term) ||
			u.email.toLowerCase().includes(term);
		const matchRole = filterRole === 'Todos' || u.rol === filterRole;
		return matchText && matchRole;
	});

	$: totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
	$: paginatedUsers = filteredUsers.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	// --- ACCIONES ---
	function openCreate() {
		isEditing = false;
		formUser = {
			id: 0,
			nombre: '',
			apellido: '',
			email: '',
			telefono: '',
			rol: 'cliente',
			idEstadoCliente: 1,
			password: ''
		};
		nombreError = '';
		apellidoError = '';
		emailError = '';
		telefonoError = '';
		passwordError = '';
		showModal = true;
	}

	function openEdit(user: User) {
		isEditing = true;
		formUser = { ...user, password: '' };
		// Validar datos existentes para limpiar errores visuales
		handleNameInput();
		handleSurnameInput();
		validateEmail();
		validatePhone();
		passwordError = ''; // Reset pass error
		showModal = true;
	}

	async function saveUser() {
		if (!isFormValid) return;

		const method = isEditing ? 'PUT' : 'POST';
		const url = isEditing
			? `http://localhost:4000/api/usuarios/${formUser.id}`
			: `http://localhost:4000/api/usuarios`;

		// Limpieza final Trim
		const payload = {
			...formUser,
			nombre: formUser.nombre.trim(),
			apellido: formUser.apellido.trim()
		};

		try {
			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.message || 'Error al guardar');
			}

			showModal = false;
			await fetchUsers();
		} catch (e: any) {
			alert(e.message);
		}
	}

	async function deleteUser(id: number) {
		if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
		try {
			const res = await fetch(`http://localhost:4000/api/usuarios/${id}`, { method: 'DELETE' });
			if (res.ok) {
				users = users.filter((u) => u.id !== id);
				selectedUsers = selectedUsers.filter((uid) => uid !== id);
			} else {
				const data = await res.json();
				alert(data.message || 'No se pudo eliminar');
			}
		} catch (e) {
			alert('Error de conexión');
		}
	}

	// --- UTILIDADES ---
	function toggleSelectAll() {
		selectedUsers =
			selectedUsers.length === paginatedUsers.length ? [] : paginatedUsers.map((u) => u.id);
	}
	function toggleSelect(id: number) {
		selectedUsers.includes(id)
			? (selectedUsers = selectedUsers.filter((uid) => uid !== id))
			: (selectedUsers = [...selectedUsers, id]);
	}
	function getInitials(name: string, lastname: string) {
		return (name.charAt(0) + lastname.charAt(0)).toUpperCase();
	}
	function formatDate(date: string) {
		if (!date) return '-';
		return new Date(date).toLocaleDateString('es-PE');
	}
</script>

<div class="flex flex-col gap-8 pb-10 w-full text-white">
	<section
		class="bg-[#0f172a]/70 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(8,112,184,0.15)] overflow-hidden flex flex-col transition-all duration-300"
	>
		<div class="p-5 flex flex-col lg:flex-row justify-between items-center gap-4">
			<div>
				<h2 class="text-lg font-bold text-white">Gestión de Usuarios</h2>
				<p class="text-xs text-gray-400">Administra clientes y permisos ({filteredUsers.length})</p>
			</div>

			<div class="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
				<div class="relative w-full sm:w-64">
					<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<svg class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/></svg
						>
					</div>
					<input
						type="text"
						bind:value={searchText}
						placeholder="Buscar..."
						class="w-full bg-[#0b1437] text-white text-sm rounded-xl pl-10 pr-4 py-2.5 border border-white/10 focus:border-blue-500 outline-none"
					/>
				</div>

				<select
					bind:value={filterRole}
					class="bg-[#0b1437] text-white text-sm rounded-xl px-4 py-2.5 border border-white/10 focus:border-blue-500 outline-none appearance-none cursor-pointer w-full sm:w-auto"
				>
					<option value="Todos">Todos</option>
					<option value="cliente">Clientes</option>
					<option value="admin">Admins</option>
				</select>

				<button
					on:click={openCreate}
					class="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase shadow-lg shadow-blue-500/30 flex items-center gap-2 whitespace-nowrap w-full sm:w-auto justify-center transition-all"
				>
					Nuevo Usuario
				</button>
			</div>
		</div>

		<div class="border-t border-white/5 overflow-x-auto min-h-[400px]">
			<table class="w-full">
				<thead class="bg-[#0b1437]/30 text-left">
					<tr>
						<th class="p-4 w-10"
							><input
								type="checkbox"
								on:change={toggleSelectAll}
								checked={selectedUsers.length > 0 && selectedUsers.length === paginatedUsers.length}
								class="rounded bg-gray-700 border-gray-600 text-blue-600 cursor-pointer"
							/></th
						>
						<th class="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Usuario</th
						>
						<th class="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider"
							>Contacto</th
						>
						<th class="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center"
							>Rol</th
						>
						<th class="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center"
							>Estado</th
						>
						<th class="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center"
							>Fecha</th
						>
						<th class="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right"
							>Acciones</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-white/5">
					{#each paginatedUsers as user (user.id)}
						<tr
							class="hover:bg-white/5 transition-colors group {selectedUsers.includes(user.id)
								? 'bg-blue-500/5'
								: ''}"
						>
							<td class="p-4"
								><input
									type="checkbox"
									checked={selectedUsers.includes(user.id)}
									on:change={() => toggleSelect(user.id)}
									class="rounded bg-gray-700 border-gray-600 text-blue-600 cursor-pointer"
								/></td
							>
							<td class="p-4">
								<div class="flex items-center gap-3">
									<div
										class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center text-white font-bold text-xs shadow-lg border border-white/10"
									>
										{getInitials(user.nombre, user.apellido)}
									</div>
									<div>
										<div class="text-sm font-bold text-white">{user.nombre} {user.apellido}</div>
										<div class="text-[10px] text-gray-500">ID: #{user.id}</div>
									</div>
								</div>
							</td>
							<td class="p-4">
								<div class="flex flex-col">
									<span class="text-xs text-gray-300">{user.email}</span>
									<span class="text-[10px] text-gray-500">{user.telefono || '-'}</span>
								</div>
							</td>
							<td class="p-4 text-center">
								<span
									class="px-3 py-1 inline-flex text-[10px] font-bold uppercase rounded-full border {user.rol ===
									'admin'
										? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
										: 'bg-blue-500/10 text-blue-400 border-blue-500/20'}"
								>
									{user.rol}
								</span>
							</td>
							<td class="p-4 text-center">
								<span
									class="px-3 py-1 inline-flex text-[10px] font-bold uppercase rounded-full border {user.idEstadoCliente ===
									1
										? 'bg-green-500/10 text-green-400 border-green-500/20'
										: user.idEstadoCliente === 3
											? 'bg-red-500/10 text-red-400 border-red-500/20'
											: 'bg-gray-500/10 text-gray-400 border-gray-500/20'}"
								>
									{user.estado || 'Desc'}
								</span>
							</td>
							<td class="p-4 text-center text-xs text-gray-400">{formatDate(user.fechaRegistro)}</td
							>
							<td class="p-4 text-right">
								<div class="flex items-center justify-end gap-2">
									<button
										on:click={() => openEdit(user)}
										class="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 hover:bg-blue-500/20 hover:text-blue-400 text-gray-400 transition-all"
										><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
											></path></svg
										></button
									>
									<button
										on:click={() => deleteUser(user.id)}
										class="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 hover:bg-red-500/20 hover:text-red-400 text-gray-400 transition-all"
										><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
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
	</section>
</div>

{#if showModal}
	<div
		transition:fade
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
	>
		<div
			class="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden"
		>
			<form on:submit|preventDefault={saveUser}>
				<div class="p-6 border-b border-white/10 flex justify-between items-center bg-[#0b1437]/30">
					<h3 class="text-xl font-bold text-white">{isEditing ? 'Editar' : 'Crear'} Usuario</h3>
					<button
						type="button"
						on:click={() => (showModal = false)}
						class="text-gray-400 hover:text-white">✕</button
					>
				</div>

				<div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label class="block text-xs font-bold text-gray-400 uppercase mb-2">Nombre</label>
						<input
							type="text"
							bind:value={formUser.nombre}
							on:input={handleNameInput}
							on:blur={handleNameInput}
							class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {nombreError
								? 'border-red-500'
								: 'border-white/10'} focus:border-blue-500 outline-none"
							placeholder="Juan"
						/>
						{#if nombreError}<p class="text-red-400 text-xs mt-1">{nombreError}</p>{/if}
					</div>
					<div>
						<label class="block text-xs font-bold text-gray-400 uppercase mb-2">Apellido</label>
						<input
							type="text"
							bind:value={formUser.apellido}
							on:input={handleSurnameInput}
							on:blur={handleSurnameInput}
							class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {apellidoError
								? 'border-red-500'
								: 'border-white/10'} focus:border-blue-500 outline-none"
							placeholder="Pérez"
						/>
						{#if apellidoError}<p class="text-red-400 text-xs mt-1">{apellidoError}</p>{/if}
					</div>
					<div class="md:col-span-2">
						<label class="block text-xs font-bold text-gray-400 uppercase mb-2">Correo</label>
						<input
							type="email"
							bind:value={formUser.email}
							on:input={validateEmail}
							on:blur={validateEmail}
							class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {emailError
								? 'border-red-500'
								: 'border-white/10'} focus:border-blue-500 outline-none"
							placeholder="usuario@email.com"
						/>
						{#if emailError}<p class="text-red-400 text-xs mt-1">{emailError}</p>{/if}
					</div>
					<div>
						<label class="block text-xs font-bold text-gray-400 uppercase mb-2">Teléfono</label>
						<input
							type="tel"
							value={formUser.telefono}
							on:input={handlePhoneInput}
							on:blur={validatePhone}
							class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {telefonoError
								? 'border-red-500'
								: 'border-white/10'} focus:border-blue-500 outline-none"
							placeholder="999..."
							maxlength="9"
						/>
						{#if telefonoError}<p class="text-red-400 text-xs mt-1">{telefonoError}</p>{/if}
					</div>
					<div>
						<label class="block text-xs font-bold text-gray-400 uppercase mb-2"
							>{isEditing ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}</label
						>
						<input
							type="password"
							bind:value={formUser.password}
							on:input={validatePassword}
							on:blur={validatePassword}
							class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {passwordError
								? 'border-red-500'
								: 'border-white/10'} focus:border-blue-500 outline-none"
							placeholder="••••••••"
						/>
						{#if passwordError}<p class="text-red-400 text-xs mt-1">{passwordError}</p>{/if}
					</div>
					<div>
						<label class="block text-xs font-bold text-gray-400 uppercase mb-2">Rol</label>
						<select
							bind:value={formUser.rol}
							class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border border-white/10 focus:border-blue-500 outline-none appearance-none"
							><option value="cliente">Cliente</option><option value="admin">Admin</option></select
						>
					</div>
					<div>
						<label class="block text-xs font-bold text-gray-400 uppercase mb-2">Estado</label>
						<select
							bind:value={formUser.idEstadoCliente}
							class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border border-white/10 focus:border-blue-500 outline-none appearance-none"
							><option value={1}>Activo</option><option value={2}>Inactivo</option><option value={3}
								>Suspendido</option
							></select
						>
					</div>
				</div>

				<div class="p-6 border-t border-white/10 flex justify-end gap-3 bg-[#0b1437]/30">
					<button
						type="button"
						on:click={() => (showModal = false)}
						class="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition"
						>Cancelar</button
					>
					<button
						type="submit"
						disabled={!isFormValid}
						class="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
						>Guardar Usuario</button
					>
				</div>
			</form>
		</div>
	</div>
{/if}
