from oilApi.oilParser import get_brent_price


def _item(price="---,--", change="0.00", percent="0.00%"):
    return {"price": str(price), "change": str(change), "percent": str(percent)}


def get_price():
    oil = _item()
    try:
        brent = get_brent_price()
        if brent and len(brent) >= 4:
            oil = _item(brent[1], brent[2], brent[3])
    except Exception as ex:
        print(f"Brent parse error for metals: {ex}")

    return {
        "oil": oil,
        "silver": _item("29.49", "+0.00", "+0.00%"),
        "gold": _item("2408.87", "+0.00", "+0.00%"),
        "platinum": _item("965.75", "+0.00", "+0.00%"),
        "nikel": _item("15900.00", "+0.00", "+0.00%"),
    }
