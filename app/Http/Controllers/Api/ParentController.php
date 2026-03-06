<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ParentUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ParentController extends Controller
{
    public function index() {
        return response()->json(['parents' => ParentUser::all()]);
    }

    public function store(Request $request) {
        $parent = new ParentUser();
        $parent->user_id = Str::uuid()->toString();
        $parent->parent_name = $request->parent_name;
        $parent->parent_email = $request->parent_email;
        $parent->password = Hash::make($request->parent_password);
        $parent->parent_phone = $request->parent_phone;
        $parent->parent_address = $request->parent_address;
        $parent->created_at = now();
        $parent->save();

        return response()->json(['parent' => $parent], 201);
    }

    public function update(Request $request, $id) {
        $parent = ParentUser::find($id);
        if ($parent) {
            $parent->update($request->only(['parent_name', 'parent_email', 'parent_phone', 'parent_address']));
        }
        return response()->json(['parent' => $parent]);
    }

    public function destroy($id) {
        $parent = ParentUser::find($id);
        if ($parent) $parent->delete();
        return response()->json(['success' => true]);
    }
}
