use serde::{Deserialize, Serialize};
use socketioxide::extract::{Data, SocketRef, State};
use tracing::info;

mod on_clear;
mod on_new_strokes;

pub use on_clear::*;
pub use on_new_strokes::*;

use crate::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Stroke {
    whiteboard_id: String,
    x1: f64,
    y1: f64,
    x2: f64,
    y2: f64,
	color: String,
	width: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SocketIoAuth {
    pub whiteboard_id: String,
}

pub async fn on_connect(
    socket: SocketRef,
    Data(SocketIoAuth { whiteboard_id }): Data<SocketIoAuth>,
    State(state): State<AppState>,
) {
    info!("Socket {} connected with whiteboard ID {:?}", socket.id, whiteboard_id);

    socket.join(whiteboard_id.clone());

    let strokes = sqlx::query_as!(Stroke, "SELECT * FROM strokes WHERE whiteboard_id = ?", whiteboard_id)
        .fetch_all(&state.pool)
        .await.unwrap();

    socket.emit("strokes", &strokes).unwrap();

    socket.on("new-stroke", on_new_stroke);
    socket.on("clear", on_clear);
}

