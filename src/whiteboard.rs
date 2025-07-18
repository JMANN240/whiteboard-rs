use std::collections::HashMap;

use axum::{
    extract::{Query, State},
    response::{IntoResponse, Redirect, Response},
};
use maud::{DOCTYPE, html};
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::{get_meta_tags, AppState};

pub async fn whiteboard(
    Query(params): Query<HashMap<String, String>>,
    State(state): State<AppState>,
) -> Response {
    match params.get("whiteboard_id") {
        Some(whiteboard_id) => {
            if !whiteboard_exists(&state.pool, whiteboard_id)
                .await
                .unwrap()
            {
                sqlx::query!("INSERT INTO whiteboards VALUES (?)", whiteboard_id)
                    .execute(&state.pool)
                    .await
                    .unwrap();
            }

            html! {
                (DOCTYPE)
                html {
                    head {
                        (get_meta_tags())
                        script src="/js/theme.js" {}
                        script src="/js/tap.js" defer {}
                        script src="/js/base.js" defer {}
                        link rel="stylesheet" href="/css/base.css";

                        script src="https://cdn.socket.io/4.8.1/socket.io.min.js" integrity="sha384-mkQ3/7FUtcGyoppY6bz/PORYoGqOl7/aSUMn2ymDOJcapfS6PHqxhRTMh1RR0Q6+" crossorigin="anonymous" defer {}
                        script src="/js/whiteboard.js" defer {}
                        link rel="stylesheet" href="/css/whiteboard.css";
                    }
                    body .roboto-100 {
                        div class="modal" {
                            div class="options-card" id="modal-options" {
                                div id="colors-container" {
                                    button class="button" id="sec-color" {}
                                    button class="button" id="red-color" { "Red" }
                                    button class="button" id="blue-color" { "Blue" }
                                    button class="button" id="green-color" { "Green" }
                                    button class="button bad" id="eraser-color" { "Eraser" }
                                }
                                button class="button" id="center-whiteboard" { "Center Whiteboard" }
                                div class="flex" {
                                    button class="button" style="flex-grow: 1;" id="clear-whiteboard" class="bad" { "Clear Whiteboard" }
                                    a href="/" class="button" style="flex-grow: 1;" id="home" { "Home" }
                                }
                            }
                        }
                        canvas id="whiteboard" {}
                    }
                }
            }
            .into_response()
        }
        None => {
            let whiteboard_id = Uuid::new_v4();

            Redirect::to(&format!(
                "/whiteboard?whiteboard_id={}",
                whiteboard_id.as_hyphenated()
            ))
            .into_response()
        }
    }
}

pub async fn whiteboard_exists(pool: &SqlitePool, whiteboard_id: &str) -> sqlx::Result<bool> {
    Ok(sqlx::query!(
        "SELECT * FROM whiteboards WHERE whiteboard_id = ?",
        whiteboard_id
    )
    .fetch_optional(pool)
    .await?
    .is_some())
}
