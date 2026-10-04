UPDATE users
SET title = COALESCE(
    NULLIF(
        TRIM(CONCAT_WS(
            ' ',
            NULLIF(NULLIF(TRIM(user_rank), ''), '-'),
            NULLIF(NULLIF(TRIM(title), ''), '-')
        )),
        ''
    ),
    '-'
);

ALTER TABLE users DROP COLUMN user_rank;
