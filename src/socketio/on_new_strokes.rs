use socketioxide::extract::{Data, SocketRef, State};

use crate::AppState;

use super::Stroke;

pub async fn on_new_stroke(
    socket: SocketRef,
    Data(stroke): Data<Stroke>,
    State(state): State<AppState>,
) {
    for room in socket.rooms() {
        if stroke.color != "erase" {
            sqlx::query!(
                "INSERT INTO strokes VALUES (?, ?, ?, ?, ?, ?, ?)",
                stroke.whiteboard_id,
                stroke.x1,
                stroke.y1,
                stroke.x2,
                stroke.y2,
                stroke.color,
                stroke.width
            )
            .execute(&state.pool)
            .await
            .unwrap();
        } else {
            sqlx::query!(
                "DELETE FROM strokes WHERE sqrt(power(x1 - ?, 2) + power(y1 - ?, 2)) <= 20 OR sqrt(power(x2 - ?, 2) + power(y2 - ?, 2)) <= 20",
                stroke.x2,
                stroke.y2,
                stroke.x2,
                stroke.y2,
            )
            .execute(&state.pool)
            .await
            .unwrap();
        }

        let strokes = sqlx::query_as!(
            Stroke,
            "SELECT * FROM strokes WHERE whiteboard_id = ?",
            room
        )
        .fetch_all(&state.pool)
        .await
        .unwrap();

        socket.to(room).emit("strokes", &strokes).await.unwrap();
    }
}
