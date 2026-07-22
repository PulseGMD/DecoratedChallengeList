import { fetchCreatorLeaderboard } from '../content.js';
import { localize } from '../util.js';

import Spinner from '../components/Spinner.js';

export default {
    components: {
        Spinner,
    },

    data: () => ({
        leaderboard: [],
        loading: true,
        selected: 0,
        err: [],
    }),

    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>

        <main v-else class="page-leaderboard-container">
            <div class="page-leaderboard">
            
                <div class="leaderboard-switch">
                    <button @click="$router.push('/leaderboard')">
                        Player Leaderboard
                    </button>   
                </div>
            
                <div class="error-container">
                    <p class="error" v-if="err.length > 0">
                        Creator leaderboard may be incorrect, as the following levels could not be loaded:
                        {{ err.join(', ') }}
                    </p>
                </div>

                <div class="board-container">
                    <table class="board">
                        <tr v-for="(creator, i) in leaderboard">

                            <td class="rank">
                                <p class="type-label-lg">#{{ i + 1 }}</p>
                            </td>

                            <td class="total">
                                <p class="type-label-lg">
                                    {{ localize(creator.total) }}
                                </p>
                            </td>

                            <td
                                class="user"
                                :class="{ active: selected == i }"
                            >
                                <button @click="selected = i">
                                    <span class="type-label-lg">
                                        {{ creator.user }}
                                    </span>
                                </button>
                            </td>

                        </tr>
                    </table>
                </div>

                <div class="player-container">
                    <div class="player">

                        <h1>#{{ selected + 1 }} {{ entry.user }}</h1>

                        <h3>{{ localize(entry.total) }} Creator Points</h3>

                        <h2>
                            Levels Created ({{ entry.levels.length }})
                        </h2>

                        <table class="table">

                            <tr v-for="level in entry.levels">

                                <td class="rank">
                                    <p>{{ level.quality }}</p>
                                </td>

                                <td class="level">
                                    <a
                                        class="type-label-lg"
                                        target="_blank"
                                        :href="level.link"
                                    >
                                        {{ level.level }}
                                    </a>
                                </td>

                                <td class="score">
                                    <p>+{{ level.score }}</p>
                                </td>

                            </tr>

                        </table>

                    </div>
                </div>

            </div>
        </main>
    `,

    computed: {
        entry() {
            return (
                this.leaderboard[this.selected] || {
                    user: "",
                    total: 0,
                    levels: [],
                }
            );
        },
    },

    async mounted() {
        const [leaderboard, err] = await fetchCreatorLeaderboard();

        this.leaderboard = leaderboard;
        this.err = err;

        this.loading = false;
    },

    methods: {
        localize,
    },
};