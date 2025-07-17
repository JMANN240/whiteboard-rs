CREATE TABLE whiteboards (
	whiteboard_id TEXT UNIQUE NOT NULL
);

CREATE TABLE strokes (
	whiteboard_id TEXT NOT NULL,
	x1 REAL NOT NULL,
	y1 REAL NOT NULL,
	x2 REAL NOT NULL,
	y2 REAL NOT NULL,
	color TEXT NOT NULL,
	width INTEGER NOT NULL,
	CONSTRAINT fk_whiteboard_id
		FOREIGN KEY (whiteboard_id)
		REFERENCES whiteboards (whiteboard_id)
);
