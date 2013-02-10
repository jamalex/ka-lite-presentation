echo "sleep 1; google-chrome http://localhost:8123/?edit" | sh &
subl presentation.sublime-project
subl index.html
python -m SimpleHTTPServer 8123