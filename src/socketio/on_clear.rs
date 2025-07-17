use socketioxide::{extract::{SocketRef, State}, SocketIo};
use tracing::info;

use crate::{socketio::Stroke, AppState};

pub async fn on_clear(
    io: SocketIo,
    socket: SocketRef,
    State(state): State<AppState>,
) {
    for room in socket.rooms() {
        info!("Clear {}", room);

        sqlx::query!("DELETE FROM strokes WHERE whiteboard_id = ?", room)
            .execute(&state.pool)
            .await.unwrap();

        let strokes = sqlx::query_as!(
            Stroke,
            "SELECT * FROM strokes WHERE whiteboard_id = ?",
            room
        )
        .fetch_all(&state.pool)
        .await
        .unwrap();

        io.to(room).emit("strokes", &strokes).await.unwrap();
    }
}
