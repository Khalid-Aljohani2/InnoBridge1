import styles from './SupervisorGanttTimeline.module.css';

function parseMs(iso) {
    const t = Date.parse(iso);
    return Number.isFinite(t) ? t : Date.now();
}

export default function SupervisorGanttTimeline({ tasks = [], isArabic }) {
    if (!tasks.length) {
        return <div className={styles.empty}>{isArabic ? 'لا توجد مهام أو مراحل لعرضها.' : 'No milestone tasks to display.'}</div>;
    }

    const starts = tasks.map((t) => parseMs(t.start));
    const ends = tasks.map((t) => parseMs(t.end));
    const min = Math.min(...starts);
    const max = Math.max(...ends);
    const span = Math.max(1, max - min);
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const ticks = [];
    for (let t = min; t <= max; t += weekMs) {
        ticks.push(t);
    }
    if (ticks.length < 2) {
        ticks.push(max);
    }

    return (
        <div className={`${styles.ganttWrap} gantt-module-scope`}>
            <div className={styles.ruler}>
                {ticks.map((tick) => (
                    <span key={tick} className={styles.tick}>
                        {new Date(tick).toLocaleDateString(isArabic ? 'ar' : 'en', { month: 'short', day: 'numeric' })}
                    </span>
                ))}
            </div>
            {tasks.map((task) => {
                const s = parseMs(task.start);
                const e = parseMs(task.end);
                const left = ((s - min) / span) * 100;
                const width = Math.max(2, ((e - s) / span) * 100);
                return (
                    <div key={task.id} className={styles.row}>
                        <div className={styles.meta}>
                            <div className={styles.metaTitle}>{task.title}</div>
                            <div>
                                {task.team_name} · {task.project_title}
                            </div>
                        </div>
                        <div className={styles.track}>
                            <div
                                className={styles.bar}
                                style={{
                                    left: `${left}%`,
                                    width: `${width}%`,
                                }}
                                title={`${task.progress ?? 0}%`}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
