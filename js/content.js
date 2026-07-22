import { round, score } from './score.js';

/**
 * Path to directory containing `_list.json` and all levels
 */
const dir = '/data';

export async function fetchList() {
    const listResult = await fetch(`${dir}/_list.json`);
    try {
        const list = await listResult.json();
        return await Promise.all(
            list.map(async (path, rank) => {
                const levelResult = await fetch(`${dir}/${path}.json`);
                try {
                    const level = await levelResult.json();
                    return [
                        {
                            ...level,
                            path,
                            records: level.records.sort(
                                (a, b) => b.percent - a.percent,
                            ),
                        },
                        null,
                    ];
                } catch {
                    console.error(`Failed to load level #${rank + 1} ${path}.`);
                    return [null, path];
                }
            }),
        );
    } catch {
        console.error(`Failed to load list.`);
        return null;
    }
}

export async function fetchEditors() {
    try {
        const editorsResults = await fetch(`${dir}/_editors.json`);
        const editors = await editorsResults.json();
        return editors;
    } catch {
        return null;
    }
}

export async function fetchLeaderboard() {
    const list = await fetchList();

    const scoreMap = {};
    const errs = [];
    list.forEach(([level, err], rank) => {
        if (err) {
            errs.push(err);
            return;
        }

        // Verification
        const verifier = Object.keys(scoreMap).find(
            (u) => u.toLowerCase() === level.verifier.toLowerCase(),
        ) || level.verifier;
        scoreMap[verifier] ??= {
            verified: [],
            completed: [],
            progressed: [],
        };
        const { verified } = scoreMap[verifier];
        verified.push({
            rank: rank + 1,
            level: level.name,
            score: score(rank + 1, 100, level.percentToQualify),
            link: level.verification,
        });

        // Records
        level.records.forEach((record) => {
            const user = Object.keys(scoreMap).find(
                (u) => u.toLowerCase() === record.user.toLowerCase(),
            ) || record.user;
            scoreMap[user] ??= {
                verified: [],
                completed: [],
                progressed: [],
            };
            const { completed, progressed } = scoreMap[user];
            if (record.percent === 100) {
                completed.push({
                    rank: rank + 1,
                    level: level.name,
                    score: score(rank + 1, 100, level.percentToQualify),
                    link: record.link,
                });
                return;
            }

            progressed.push({
                rank: rank + 1,
                level: level.name,
                percent: record.percent,
                score: score(rank + 1, record.percent, level.percentToQualify),
                link: record.link,
            });
        });
    });

    // Wrap in extra Object containing the user and total score
    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const { verified, completed, progressed } = scores;
        const total = [verified, completed, progressed]
            .flat()
            .reduce((prev, cur) => prev + cur.score, 0);

        return {
            user,
            total: round(total),
            ...scores,
        };
    });

    // Sort by total score
    return [res.sort((a, b) => b.total - a.total), errs];
}

/* ===========================
   Creator Leaderboard
=========================== */

const QUALITY_POINTS = {
    normal: 1,
    featured: 2,
    epic: 3,
    legendary: 4,
    mythic: 5,
};

export async function fetchCreatorLeaderboard() {
    const list = await fetchList();

    const creatorMap = {};
    const errs = [];

    list.forEach(([level, err]) => {
        if (err) {
            errs.push(err);
            return;
        }

        const points =
            QUALITY_POINTS[(level.quality || "").toLowerCase()] || 0;

        if (!level.creators || level.creators.length === 0) {
            return;
        }

        level.creators.forEach((creator) => {
            const user =
                Object.keys(creatorMap).find(
                    (u) => u.toLowerCase() === creator.toLowerCase(),
                ) || creator;

            creatorMap[user] ??= {
                levels: [],
            };

            creatorMap[user].levels.push({
                level: level.name,
                quality: level.quality,
                score: points,
                rank: level.rank,
                link: level.verification,
            });
        });
    });

    const res = Object.entries(creatorMap).map(([user, data]) => ({
        user,
        total: round(
            data.levels.reduce((sum, level) => sum + level.score, 0),
        ),
        levels: data.levels.sort((a, b) => b.score - a.score),
    }));

    return [
        res.sort((a, b) => {
            if (b.total !== a.total) {
                return b.total - a.total;
            }

            return a.user.localeCompare(b.user);
        }),
        errs,
    ];
}