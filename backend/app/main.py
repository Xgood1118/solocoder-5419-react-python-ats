from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import PORT
from app.routes import job, candidate, resume, application, interview, offer, hire, stats

app = FastAPI(title="ATS 招聘管理系统", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(job.router)
app.include_router(candidate.router)
app.include_router(resume.router)
app.include_router(application.router)
app.include_router(interview.router)
app.include_router(offer.router)
app.include_router(hire.router)
app.include_router(stats.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "ATS系统运行正常"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
