## Running the Application

## Required Software

1. Python
2. Node.js
3. Docker and Docker Compose
4. [Poetry](https://python-poetry.org/docs/#installation)
5. Postgres libpq header files (e.g. `apt install libpq-dev` on Ubuntu, `brew install postgresql` on macOS)

### First-Time Setup

1. `cd` into `backend` and run `poetry install`.
2. `cd` into `frontend` and run `npm install`.

### Running the Application

1. From the root directory, run `docker compose up`.
2. In a separate terminal, `cd` into `backend` and run `poetry run uvicorn main:app --reload`.
3. In a separate terminal, `cd` into `frontend` and run `npm run dev`.


### Time spent
1. Backend planning (10 minutes)
2. Implementation (30 minutes)
3. Frontend planning (10 minutes)
3. Implementation (1 hour)

### Database
1. User (for storing user information).
2. Thread (threads/topics for each instance of a chat).
3. Message (messages associated with a specific thread).