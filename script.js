document.addEventListener('DOMContentLoaded', () => {
    const moviesContainer = document.getElementById('movies-container');
    const filterYearSelect = document.getElementById('filter-year');
    const searchTitleInput = document.getElementById('search-title');
    
    const filterGenreSelect = document.createElement('select');
    filterGenreSelect.id = 'filter-genre';
    const filtersDiv = document.querySelector('.filters');
    const genreLabel = document.createElement('label');
    genreLabel.textContent = "Filtra per Genere:";
    filtersDiv.appendChild(genreLabel);
    filtersDiv.appendChild(filterGenreSelect);

    let allItems = [];
    const TMDB_API_KEY = "LA_TUA_CHIAVE_API";

    // Funzione per caricare i dati dal file JSON e da TMDB
    async function fetchItems() {
        try {
            const response = await fetch('films.json');
            const data = await response.json();
            allItems = data.Items;

            const itemsWithMetadata = await Promise.all(allItems.map(async item => {
                const tmdbId = item.ProviderIds.Tmdb;
                if (tmdbId) {
                    const tmdbResponse = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=it-IT`);
                    if (tmdbResponse.ok) {
                        const tmdbData = await tmdbResponse.json();
                        item.genres = tmdbData.genres.map(g => g.name);
                        item.posterPath = tmdbData.poster_path;
                        item.overview = tmdbData.overview;
                    }
                }
                return item;
            }));

            allItems = itemsWithMetadata;
            populateFilters(allItems);
            displayInitialItems();
        } catch (error) {
            console.error('Errore nel caricamento dei dati:', error);
        }
    }

    // Funzione per visualizzare solo gli ultimi 3 inserimenti
    function displayInitialItems() {
        const sortedItems = allItems.sort((a, b) => new Date(b.DateCreated) - new Date(a.DateCreated));
        const uniqueDates = [...new Set(sortedItems.map(item => item.DateCreated.substring(0, 10)))];
        const latestDates = uniqueDates.slice(0, 3);
        const initialItems = sortedItems.filter(item => latestDates.includes(item.DateCreated.substring(0, 10)));
        displayItems(initialItems);
    }

    // Funzione per popolare i menu a discesa dei filtri
    function populateFilters(items) {
        const years = [...new Set(items.map(item => item.ProductionYear))].filter(y => y).sort((a, b) => b - a);
        filterYearSelect.innerHTML = '<option value="">Tutti gli anni</option>';
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            filterYearSelect.appendChild(option);
        });

        const allGenres = items.reduce((acc, item) => {
            if (item.genres) {
                item.genres.forEach(genre => acc.add(genre));
            }
            return acc;
        }, new Set());

        filterGenreSelect.innerHTML = '<option value="">Tutti i generi</option>';
        [...allGenres].sort().forEach(genre => {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = genre;
            filterGenreSelect.appendChild(option);
        });
    }

    // Funzione per visualizzare gli elementi
    function displayItems(items) {
        moviesContainer.innerHTML = '';
        if (items.length === 0) {
            moviesContainer.innerHTML = '<p>Nessun risultato trovato.</p>';
            return;
        }

        items.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.classList.add('movie-card');

            const date = new Date(item.DateCreated);
            const formattedDate = date.toLocaleDateString('it-IT');
            const genresList = item.genres ? item.genres.join(', ') : 'N/A';
            
            const posterUrl = item.posterPath ? `https://image.tmdb.org/t/p/w500${item.posterPath}` : '';
            const posterImage = posterUrl ? `<img src="${posterUrl}" alt="Locandina di ${item.Name}">` : '';
            const overviewText = item.overview ? `<p class="overview">${item.overview}</p>` : '';

            itemCard.innerHTML = `
                ${posterImage}
                <div class="movie-card-content">
                    <h2>${item.Name}</h2>
                    <p><strong>Anno di produzione:</strong> ${item.ProductionYear || 'N/A'}</p>
                    <p><strong>Genere:</strong> ${genresList}</p>
                    <p><strong>Inserito il:</strong> ${formattedDate}</p>
                    ${overviewText}
                </div>
            `;
            moviesContainer.appendChild(itemCard);
        });
    }

    // Funzione per filtrare gli elementi
    function filterItems() {
        const selectedYear = filterYearSelect.value;
        const selectedGenre = filterGenreSelect.value;
        const searchTerm = searchTitleInput.value.toLowerCase();
        
        const filtered = allItems.filter(item => {
            const matchYear = selectedYear === '' || (item.ProductionYear && item.ProductionYear.toString() === selectedYear);
            const matchGenre = selectedGenre === '' || (item.genres && item.genres.includes(selectedGenre));
            const matchTitle = item.Name.toLowerCase().includes(searchTerm);

            return matchYear && matchGenre && matchTitle;
        });
        displayItems(filtered);
    }

    // Aggiungi gli eventi per i filtri
    filterYearSelect.addEventListener('change', filterItems);
    filterGenreSelect.addEventListener('change', filterItems);
    searchTitleInput.addEventListener('input', filterItems);

    fetchItems();
});