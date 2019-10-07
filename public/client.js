// import "./styles.scss";
/*todo:
- Authentication
  - When user installs client from website genereates new random id (unless signed in)
  - Save snips
  - Publish snips
  - Rate snips
  - See updates
  - When installing snips, get userdata
  - Sync data
  - See all snips/edit them
  ! Need to have ability to reset auth code
  - Search private snippets
- Installations/updates
- Install count
- Export client w/ data
- Sanitize inputs, make sure text doesn't overflow
- Pagination
- Windows vs content scripts
- Create snip pack
- See all//top
*/

(() => {
	const $f = d => q => d.querySelector(q);
	const makeState = obj => {
		let listeners = {};
		let ret = {};
		let vals = {};
		for (let i in obj) {
			listeners[i] = [];
			vals[i] = obj[i];
			Object.defineProperty(ret, i, {
				get: () => vals[i],
				set: v => {
					const old = vals[i];
					vals[i] = v;
					listeners[i].forEach(f => f(v, old));
				}
			});
		}
		ret.subscribe = (n, f) => {
			if (typeof n === "object") {
				for (let i in n) ret.subscribe(i, n[i]);
			} else {
				listeners[n].push(f);
				f(vals[n]);
			}
		};
		return ret;
	};

	const debounce = (f, t = 500) => {
		let c;
		return (...args) => {
			clearTimeout(c);
			c = setTimeout(() => f(...args), t);
		};
	};

	const classSetter = (el, className) => v => {
		if (v) {
			el.classList.add(className);
		} else {
			el.classList.remove(className);
		}
	};

	// Graphql

	const mapJoin = f => (strs, ...values) =>
		strs.reduce((a, str, i) => a + str + f(values[i] || ""), "");

	const html = mapJoin(a => a),
		encode = mapJoin(encodeURIComponent);
	const css = html;

	const gql = (strs, ...values) => ({
		variables,
		auth = "",
		select = a => a
	}) => async () => {
		const val = await (await fetch(
			"https://snippit-backend.herokuapp.com/graphql",
			{
				headers: {
					"content-type": "application/json",
					authentication: auth
				},
				body: JSON.stringify({
					operationName: null,
					variables,
					query: encode(strs, ...values)
				}),
				method: "POST",
				mode: "cors"
			}
		)).json();
		if (val.data) return select(val.data);
		console.log(val.errors);
		throw val.errors;
	};

	const queries = {
		login: gql`{
            validate(username:"$username", password:"$password")
        }`,
		searchSnippets: gql`
			query SearchSnips($name: String) {
				snips(query: { name: $name }) {
					name
					owner {
						username
					}
				}
			}
		`,
		getUpdate: async ({ variables, auth, selector }) => {
			return Math.random() > 0.5
				? {
						available: true,
						text: "asdf"
				  }
				: {
						available: false,
						text: null
				  };
		}
	};

	// Handlers

	const windowHandler = (state, $) => {
		const close = $("#toggle-closed"),
			parent = $("#parent"),
			bottomBar = $("#bottom-bar"),
			searchTab = $("#search-tab"),
			authTab = $("#auth-tab"),
			mainTabs = $("#main-tabs");

		let mouseOffsetX = null,
			mouseOffsetY = null,
			mouseResizeOffsetX = null,
			mouseResizeOffsetY = null,
			mouseDragged = false;

		const { left, bottom } = parent.getBoundingClientRect();
		state.location = [left, bottom];

		const tabs = {
			auth: { tab: authTab, i: 1 },
			search: { tab: searchTab, i: 0 }
		};

		state.subscribe("closed", classSetter(parent, "closed"));
		state.subscribe("offLeft", classSetter(bottomBar, "reversed"));
		state.subscribe("currentTab", v => {
			mainTabs.style.transform = `translateX(${tabs[v].i *
				-(100 / Object.keys(tabs).length)}%)`;
			Object.entries(tabs).forEach(([n, { tab }]) =>
				classSetter(tab, "actice")(v === n)
			);
		});
		state.subscribe("location", v => {
			if (v === null) return;
			const { width } = parent.getBoundingClientRect();
			parent.style.left =
				v[0] - (state.offLeft ? width - mouseOffsetX * 2 : 0) + "px";
			parent.style.bottom = window.innerHeight - v[1] + "px";
			state.offLeft = v[0] + width > window.innerWidth;
		});
		state.subscribe("resize", v => {
			document.body.style.cursor = {
				both: "ne-resize",
				right: "e-resize",
				top: "n-resize",
				none: "unset"
			}[v];
			parent.classList.remove("resize-right", "resize-top");
			parent.classList.add(
				...{
					both: ["resize-right", "resize-top"],
					right: ["resize-right"],
					top: ["resize-top"],
					none: []
				}[v]
			);
		});
		state.subscribe("size", v => {
			if (v !== null) {
				parent.style.width = v[0] + "px";
				parent.style.height = v[1] + "px";
				parent.style.maxWidth = v[0] + "px";
				parent.style.maxHeight = v[1] + "px";
			}
		});

		close.addEventListener("click", () => {
			if (!mouseDragged) state.closed = !state.closed;
			mouseDragged = false;
		});
		close.addEventListener("mousedown", e => {
			const { left, bottom, width } = parent.getBoundingClientRect();
			mouseOffsetX = state.offLeft
				? width - (e.clientX - left)
				: e.clientX - left;
			mouseOffsetY = e.clientY - bottom;
		});
		window.addEventListener("mousedown", e => {
			const { left, bottom } = parent.getBoundingClientRect();
			if (state.resize === "right" || state.resize === "both")
				mouseResizeOffsetX = e.clientX - left - state.size[0];
			if (state.resize === "top" || state.resize === "both")
				mouseResizeOffsetY = bottom - e.clientY - state.size[1];
		});
		window.addEventListener(
			"mousemove",
			({ clientX, clientY }) => {
				const {
					left,
					bottom,
					right,
					top
				} = parent.getBoundingClientRect();

				state.resize = new Map([
					[true, "none"],
					[Math.abs(clientY - top) < 5, "top"],
					[Math.abs(clientX - right) < 5, "right"],
					[
						Math.abs(clientX - right) < 20 &&
							Math.abs(clientY - top) < 20,
						"both"
					]
				]).get(true);

				if (mouseOffsetX !== null) {
					state.location = [
						clientX - mouseOffsetX,
						clientY - mouseOffsetY
					];
					mouseDragged = true;
				}

				state.size = [
					mouseResizeOffsetX !== null
						? clientX - left - mouseOffsetX
						: state.size[0],
					mouseResizeOffsetY !== null
						? bottom - clientY - mouseOffsetY
						: state.size[1]
				];
			},
			{ passive: true }
		);
		window.addEventListener(
			"mouseup",
			e => {
				mouseOffsetX = null;
				mouseOffsetY = null;
				mouseResizeOffsetX = null;
				mouseResizeOffsetY = null;
			},
			{ passive: true }
		);
		parent.addEventListener("mouseenter", () => (state.closed = false));
		authTab.addEventListener("click", () => (state.currentTab = "auth"));
		searchTab.addEventListener(
			"click",
			() => (state.currentTab = "search")
		);
	};
	const searchHandler = (state, $) => {
		const searchInput = $("#search-input");

		const execSearch = async v => {
			state.loading = true;
			const r =
				state.currentQuery === ""
					? null
					: await queries.searchSnippets(state.currentQuery);
			if (v === state.currentQuery) {
				state.currentResults = r;
				state.loading = false;
			}
		};
		const debounced = debounce(execSearch);

		state.subscribe("currentQuery", v => {
			state.currentResults = null;
			state.loading = false;
			searchInput.value = v;
			debounced(v);
		});

		searchInput.addEventListener("input", e => {
			state.currentQuery = e.target.value;
		});
	};

	const Result = state => snip => {
		const { id, name } = snip;
		const container = document.createElement("div");
		container.innerHTML = `<div class="snippet-name">${name}</div>`;
		container.id = "snippet-" + id;
		container.classList.add("snippet-container");
		container.addEventListener(
			"click",
			() => (state.currentSnippet = snip)
		);
		return container;
	};
	const resultsHandler = (state, $) => {
		const noSearch = $("#no-search");
		const noResults = $("#no-results");
		const loader = $("#loader");
		const resultList = $("#result-list");
		const searchButton = $("#search-button");

		state.subscribe({
			currentQuery: v => (noSearch.hidden = v !== ""),
			loading: v => {
				loader.hidden = !v;
				stateSetter(searchButton, "loading")(v);
			},
			currentResults: v => {
				noResults.hidden = v === null || v.length > 0;
				resultList.innerHTML = "";
				if (v !== null) {
					resultList.appendChild(
						v
							.map(Result(state, $))
							.reduce(
								(a, v) => (a.appendChild(v), a),
								document.createDocumentFragment()
							)
					);
				}
			}
		});
	};
	const snippetHandler = (state, $) => {
		const snippetName = $("#snippet-name");
		const snipMaker = $("#snip-maker");
		const snipVersion = $("#snip-version");
		const installSnip = $("#install-snip");
		const snippetDescription = $("#snippet-description");
		const backButton = $("#back-button");
		const sectionsContainer = $("#sections-container");

		state.subscribe("currentSnippet", async v => {
			classSetter(sectionsContainer, "snippet-focused", v !== null);
			if (v !== null) {
				snippetName.innerText = v.name;
				snipVersion.innerText = snipMaker.innerText = snippetDescription.innerText =
					"...Loading";

				const {
					desc,
					version,
					owner,
					content
				} = await queries.searchSnippets({
					variables: { name: v.name }
				})[0];
				snipVersion.innerText = version;
				snipMaker.innerText = owner.username;
				snippetDescription.innerText = desc;
				installSnip.href = `javascript:${content}`;
			}
		});

		backButton.addEventListener("click", () => {
			state.currentSnippet = null;
		});
	};
	const authHandler = (state, $) => {
		const emailInput = $("#email-input");
		const passwordInput = $("#password-input");

		const formState = makeState({
			email: "",
			password: ""
		});

		formState.subscribe({
			email: v => (emailInput.value = v),
			password: v => (passwordInput.value = v)
		});

		emailInput.addEventListener("input", v => {
			formState.email = v;
		});

		passwordInput.addEventListener("input", v => {
			formState.password = v;
		});
	};

	const client = (container, auth, style) => {
		const state = makeState({
			closed: false,
			loading: false,
			currentQuery: "",
			currentSnippet: null,
			currentResults: null,
			location: [16, window.innerHeight - 16],
			size: [250, 350],
			auth,
			currentTab: "search",
			offLeft: false,
			resize: "none"
		});
		const containerShadow = container.attachShadow({ mode: "open" });
		containerShadow.innerHTML = html`
            <style>${style}</style>
            <div id="parent">
                <div id="body">
                    <div id="sections-container">
                    <section class="section" id="section-search">
                        <div class="top-bar">
                        <span class="nav-link active" id="search-tab">Search</span> / <span class="nav-link" id="auth-tab">Authenticate</span>
                        </div>
                        <div class="panel-body">
                        <div id="main-tabs">
                            <div id="search-panel" class="tab-panel">
                            <div id="search-container">
                                <input placeholder="Search..." autocomplete="off" type="text" id="search-input"/>
                                <button id="search-button"></button>
                            </div>
                            <div id="result-container">
                                <p id="no-search">Start typing to search</p>
                                <p id="no-results">No results found</p>
                                <p id="loader">
                                <img class="loader-image" src="https://samherbert.net/svg-loaders/svg-loaders/spinning-circles.svg"/>
                                Loading
                                </p>
                                <div id="result-list"></div>
                            </div>
                            </div>
                            <div id="auth-panel" class="tab-panel">
                            <h3>Sign in</h3>
                            <input id="email-input" class="input" placeholder="Email"></input>
                            <input id="password-input" class="input" type="password" placeholder="Password"></input>
                            <button id="auth-button">Sign In</button>
                            </div>
                        </div>
                        </div>
                    </section>
                    <section class="section" id="section-snippit">
                        <div class="top-bar"><button id="back-button"><i></i></button> Install Snippet</div>
                        <div class="panel-body">
                        <h3 id="snippet-name"></h3>
                        <div class="meta-info">
                            <h6 id="snip-maker"></h6>
                            <h6 id="snip-version"></h6>
                            <a id="install-snip" class="button">Run</a>
                        </div>
                        <p id="snippet-description"></p>
                        <a href="https://example.com">See on page</a>
                        </div>
                    </section>
                    </div>
                </div>
                <div id="bottom-bar">
                    <button id="toggle-closed">&times;</button>
                    <a href="https://snippet.ml">See on snippet website</a>
                </div>
            </div>
        `;

		const $ = $f(containerShadow);

		windowHandler(state, $);
		searchHandler(state, $);
		resultsHandler(state, $);
		snippetHandler(state, $);
	};
	const d = document.createElement("div");
	document.body.appendChild(d);
	client(
		d,
		{},
		css`
			body,
			html {
				background-color: #eee;
			}
			#parent {
				z-index: 1e50;
				position: fixed;
				left: 1em;
				bottom: 1em;
				background-color: #fff;
				border-radius: 2em;
				min-width: 205px;
				min-height: 300px;
				max-width: 25vw;
				max-height: 50vh;
				display: flex;
				flex-direction: column;
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06),
					0 2px 4px rgba(0, 0, 0, 0.12);
				transition: opacity 0.25s ease-in-out,
					box-shadow 0.25s ease-in-out;
			}
			#parent.resize-top {
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06),
					0 2px 4px rgba(0, 0, 0, 0.12), 0 -5px 10px -5px #0074d9;
			}
			#parent.resize-right {
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06),
					0 2px 4px rgba(0, 0, 0, 0.12), 5px 0 10px -5px #0074d9;
			}
			#parent.resize-right.resize-top {
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06),
					0 2px 4px rgba(0, 0, 0, 0.12), 5px -5px 10px -5px #0074d9;
			}
			#parent.closed {
				max-width: 2.5rem;
				max-height: 2.5rem;
				min-width: 2.5rem;
				min-height: 2.5rem;
				transition: opacity 0.25s ease-in-out,
					max-width 0.25s ease-in-out, max-height 0.25s ease-in-out,
					min-width 0.25s ease-in-out, min-height 0.25s ease-in-out,
					box-shadow 0.25s ease-in-out;
			}
			#toggle-closed {
				padding: 0.5em;
				position: absolute;
				left: 0.75em;
				bottom: 0.75em;
				width: 2.5rem;
				height: 2.5rem;
				border-radius: 2em;
				border: none;
				outline: 0;
				cursor: pointer;
				font-family: "Lucida Console", Monaco, monospace;
				user-select: none;
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12),
					0 2px 4px rgba(0, 0, 0, 0.24);
				transition: bottom 0.25s ease-in-out, left 0.25s ease-in-out,
					background 0.25s ease-in-out;
			}
			.closed #toggle-closed {
				left: 0;
				bottom: 0;
			}
			#body {
				flex-grow: 1;
				width: 100%;
				overflow: hidden;
			}
			#bottom-bar {
				height: 1.5em;
				padding: 1em;
				padding-right: 2em;
				text-align: right;
			}
			#bottom-bar.reversed {
				text-align: left;
			}
			#bottom-bar.reversed #toggle-closed {
				left: unset;
				right: 0.75em;
			}
			.closed #bottom-bar.reversed #toggle-closed {
				right: 0;
				bottom: 0;
			}
			#main-tabs {
				height: 100%;
				width: 200%;
				display: flex;
				transition: transform 0.25s ease-in-out;
			}
			.tab-panel {
				min-width: 50%;
				max-width: 50%;
				padding: 1em;
				box-sizing: border-box;
				height: 100%;
			}
			#sections-container {
				height: 100%;
				width: calc(200%);
				display: flex;
				transition: transform 0.25s ease-in-out;
			}
			#sections-container.snippet-focused {
				transform: translateX(-50%);
			}
			.section {
				min-width: 50%;
				max-width: 50%;
				box-sizing: border-box;
				height: 100%;
			}
			.top-bar {
				font-size: 1.2em;
				margin-bottom: 0.5em;
				text-align: center;
				position: relative;
				padding: 1em;
				padding-bottom: 0;
			}
			.top-bar button {
				position: absolute;
				left: 0;
				top: 0;
				border: none;
				background: 0 0;
				transform: translateY(-3px);
				width: 2em;
				height: 2em;
				cursor: pointer;
				outline: 0;
			}
			.top-bar button i {
				border: solid #000;
				border-width: 0 3px 3px 0;
				display: inline-block;
				padding: 3px;
				transform: rotate(135deg);
			}
			.top-bar .nav-link {
				color: #888;
				cursor: pointer;
				user-select: none;
			}
			.top-bar .nav-link.active,
			.top-bar .nav-link:hover {
				color: #000;
			}
			.panel-body {
				height: 100%;
				width: 100%;
				display: flex;
				flex-direction: column;
				overflow-x: hidden;
			}
			.input {
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12),
					0 2px 4px rgba(0, 0, 0, 0.24);
				height: 2rem;
				border-radius: 2rem;
				box-sizing: border-box;
				padding: 1em;
				border: none;
				outline: 0;
				display: block;
				width: 90%;
				margin: 1em auto;
			}
			.loader-image {
				color: #000;
			}
			button {
				padding: 0.75em 1.5em;
				cursor: pointer;
				background: #ddd;
				border: none;
				transition: background 0.25s ease-in-out;
			}
			button:hover {
				background: #ccc;
			}
			#auth-button {
				margin-left: auto;
				display: block;
			}
			#search-container {
				z-index: 2;
				display: flex;
				align-items: stretch;
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12),
					0 2px 4px rgba(0, 0, 0, 0.24);
				height: 1.75rem;
				border-radius: 1.75em;
				padding: 0.25em;
			}
			#search-container button {
				font-family: "Lucida Console", Monaco, monospace;
				outline: 0;
				box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12),
					0 1px 2px rgba(0, 0, 0, 0.24);
				min-width: 1.75rem;
				height: 1.75rem;
				border-radius: 1.75em;
				border: none;
				padding: 0.5em;
				transition: background 0.1s ease-in-out,
					box-shadow 0.25s ease-in-out;
				background: center/1% no-repeat
						url(http://samherbert.net/svg-loaders/svg-loaders/three-dots.svg),
					#4caa40;
			}
			#search-container button::before {
				content: ">";
				color: #fff;
			}
			#search-container button.loading {
				background-color: #d8bb00;
				background-size: 75%;
			}
			#search-container button.loading::before {
				content: "";
			}
			#back-button {
				margin: 1.5em;
				padding: 0.5em;
			}
			#search-input {
				flex-grow: 1;
				flex-shrink: 1;
				min-width: 0;
				border: none;
				background: 0 0;
				box-sizing: border-box;
				padding: 1em;
				outline: 0;
			}
			#result-container {
				padding: 0.5em 0;
				overflow: auto;
				flex-grow: 1;
			}
			#result-list {
				overflow-y: auto;
			}
			.loader-image {
				width: 3em;
			}
			.snippet-container {
				user-select: none;
				padding: 0.5em;
				cursor: pointer;
			}
			.snippet-container:hover {
				background-color: #eee;
			}
			#section-snippit .panel-body {
				padding: 1em;
				box-sizing: border-box;
			}
			#section-snippit .panel-body h3 {
				margin: 0;
			}
		`
	);
})();