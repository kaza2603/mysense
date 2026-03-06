<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LearningVideo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class VideoController extends Controller
{
    // Translated from your Node.js getVideos
    public function index(Request $request)
    {
        // 1. If it's a Teacher, get their specific videos
        if (Auth::guard('teacher')->check()) {
            $teacher = Auth::guard('teacher')->user();
            $videos = LearningVideo::where('teacher_id', $teacher->teacher_id)->get();
            return response()->json($videos);
        }

        // 2. If it's a Student, get videos for their specific class & school
        if (Auth::guard('student')->check()) {
            $student = Auth::guard('student')->user();

            if (!$student->class_id || !$student->school_id) {
                return response()->json(['message' => 'Student must be assigned to a class and school to view videos'], 400);
            }

            $videos = LearningVideo::where('class_id', $student->class_id)
                                 ->where('school_id', $student->school_id)
                                 ->get();
            return response()->json($videos);
        }

        return response()->json(['message' => 'Access denied'], 403);
    }

    // Translated from your Node.js createVideo
    public function store(Request $request)
    {
        if (!Auth::guard('teacher')->check()) {
            return response()->json(['message' => 'Access denied'], 403);
        }

        $request->validate([
            'youtube_link' => ['required', 'regex:/^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/'],
            'title' => 'required|max:100',
            'class_id' => 'required',
            'description' => 'nullable|max:500'
        ], [
            'youtube_link.regex' => 'Must be a valid YouTube URL'
        ]);

        $teacher = Auth::guard('teacher')->user();

        $video = new LearningVideo();
        $video->learning_video_id = Str::uuid()->toString();
        $video->teacher_id = $teacher->teacher_id;
        $video->school_id = $teacher->school_id;
        $video->class_id = $request->class_id;
        $video->youtube_link = $request->youtube_link;
        $video->title = $request->title;
        $video->description = $request->description;
        $video->created_at = now();
        $video->save();

        return response()->json($video, 201);
    }

    // Translated from your Node.js updateVideo
    public function update(Request $request, $id)
    {
        if (!Auth::guard('teacher')->check()) {
            return response()->json(['message' => 'Access denied'], 403);
        }

        $video = LearningVideo::find($id);

        if (!$video) {
            return response()->json(['message' => 'Learning video not found'], 404);
        }

        if ($video->teacher_id !== Auth::guard('teacher')->id()) {
            return response()->json(['message' => 'You can only update videos that you created'], 403);
        }

        $video->update($request->only(['youtube_link', 'title', 'description']));

        return response()->json($video);
    }

    // Translated from your Node.js deleteVideo
    public function destroy($id)
    {
        if (!Auth::guard('teacher')->check()) {
            return response()->json(['message' => 'Access denied'], 403);
        }

        $video = LearningVideo::find($id);

        if (!$video) {
            return response()->json(['message' => 'Learning video not found'], 404);
        }

        if ($video->teacher_id !== Auth::guard('teacher')->id()) {
            return response()->json(['message' => 'You can only delete videos that you created'], 403);
        }

        $video->delete();

        return response()->json(['message' => 'Video successfully deleted']);
    }
}
