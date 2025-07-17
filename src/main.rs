use std::env;

use axum::routing::get;
use whiteboard::whiteboard;
use clap::Parser;
use dotenvy::dotenv;
use maud::{Markup, html};
use socketio::on_connect;
use socketioxide::SocketIo;
use sqlx::SqlitePool;
use tower_http::services::ServeDir;
use tracing::info;
use tracing_subscriber::FmtSubscriber;

mod whiteboard;
mod socketio;

#[derive(Parser)]
struct Cli {
    port: u16,
}

#[derive(Clone)]
struct AppState {
    pool: SqlitePool,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing::subscriber::set_global_default(FmtSubscriber::default())?;
    let cli = Cli::parse();
    dotenv()?;

    let pool = SqlitePool::connect(
        &env::var("DATABASE_URL").expect("DATABASE_URL environment variable not set"),
    )
    .await
    .unwrap();

    let app_state = AppState { pool };

    let (layer, io) = SocketIo::builder()
        .with_state(app_state.clone())
        .build_layer();

    io.ns("/", on_connect);


    let app = axum::Router::new()
        .route("/", get(whiteboard))
        .route("/whiteboard", get(whiteboard))
        .fallback_service(ServeDir::new("static"))
        .with_state(app_state)
        .layer(layer);

    info!("Starting server");

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", cli.port)).await.unwrap();
    axum::serve(listener, app).await.unwrap();

    Ok(())
}

pub fn get_meta_tags() -> Markup {
    let title = "Whiteboard";
    let description = "Draw freely.";

    html! {
        title { (title) }
        meta name="description" content=(description);

        meta property="og:url" content="https://whiteboard.jtraber.com/";
        meta property="og:type" content="website";
        meta property="og:title" content=(title);
        meta property="og:description" content=(description);

        meta name="twitter:card" content="summary_large_image";
        meta property="twitter:domain" content="whiteboard.jtraber.com";
        meta property="twitter:url" content="https://whiteboard.jtraber.com/";
        meta name="twitter:title" content=(title);
        meta name="twitter:description" content=(description);
    }
}
