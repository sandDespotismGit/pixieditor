from src.database.database import db


def create_file(url: str, type: str, player_number: int, count_play: int, time_view: int, position: int, panel_id: int):
    query = "INSERT INTO files_new (url, type, player_number, count_play, time_view, position, panel_id) VALUES (%s, %s, %s, %s, %s, %s, %s)"
    db.execute_query(query, (url, type, player_number, count_play, time_view, position, panel_id))

    query = "SELECT MAX(id) as id FROM files_new"
    result = db.fetch_one(query)
    return result['id']


def get_panel_files(panel_id: int):
    query = "SELECT * FROM files_new WHERE panel_id= %s"
    result = db.fetch_all(query, (panel_id,))
    return result


def get_panel_files_by_id(id: int):
    query = "SELECT * FROM files_new WHERE id= %s"
    result = db.fetch_one(query, (id,))
    return result


def shift_media_positions(panel_id: int, offset: int):
    if offset <= 0:
        return True

    query = """
        UPDATE files_new
        SET position = position + %s
        WHERE panel_id = %s AND type IN ('video', 'image')
    """
    db.execute_query(query, (offset, panel_id))
    return True


def update_file(id: int, url: str, type: str, player_number: int, count_play: int, time_view: int, position: int, panel_id: int):
    query = """UPDATE files_new
                SET url = %s,
                    type = %s,
                    player_number = %s,
                    count_play = %s,
                    time_view = %s,
                    position = %s,
                    panel_id = %s
                WHERE id = %s
                """
    data_for_update = (url, type, player_number, count_play, time_view, position, panel_id, id,)

    db.execute_query(query, data_for_update)


def delete_file(id: int):
    query = "DELETE FROM files_new WHERE id=%s"
    data = (id,)

    db.execute_query(query, data)

    return True
