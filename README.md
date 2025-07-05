# Workbox
This app streamlines study by letting students upload their school curriculum, then automatically finding and organizing relevant worksheets and notes from across the internet. It eliminates tab clutter and wasted time, putting all the resources students need in one place.

## Customer Journey
1. User inputs their curriculum of interest.
2. Our app searches online for worksheets and notes. The algorithm does some filtration, pre-processing, and post-processing.
3. After the algorithm finishes, it sorts them into individual clickable folders that lead the user to the corresponding list of worksheets and notes.
4. User can then export and download them.
5. User may upgrade to Pro tier for better features and less limitations.

## Folder Structure
```py
workbox/
├── client/     # All frontend code
├── server/     # All backend code
├── up.bash     # This script runs the whole project at once
├── down.bash   # This script stops the whole project and cleans up resources
└── README.md
```

## Quick Start
1. You may need proper permissions to import the codebase:
    `git pull git@github.com:Mahmh/workbox.git`

2. Start the app:
    `bash up.bash`

3. Stop the app:
    `bash down.bash`