# Campus Customs

Yale gear shop. The site is a Vite React app. The API is a FastAPI app in `backend/main.py`.

The database and product photos are not in this repository. Place the data pack before starting the API:

- `data/campus_customs.db`
- `data/products/` (one photo for each catalogue row)

Copy `.env.example` to `.env` in this folder and set `PORTKEY_API_KEY`. Do not commit `.env`.

## Back end

From this folder:

```powershell
python -m venv backend\.venv
backend\.venv\Scripts\python -m pip install -r requirements.txt
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

`main.py` is the FastAPI app. The command above starts it.

## Front end

From `frontend/`, in a second terminal:

```powershell
npm install
npm run dev
```

Open http://127.0.0.1:5173/. The page sends `/api` and `/media` to the API on port 8000.

A test account is already in the database: `test@campuscustoms.yale.edu` / `password`.
