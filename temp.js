// app.js
// ... (other code)

app.delete("/deleteTask/:taskId", async (req, res) => {
    const { taskId } = req.params;
  
    try {
      // Ensure taskId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ status: 'error', data: 'Invalid taskId' });
      }
  
      // Use findByIdAndDelete to delete the task based on its _id
      const deletedTask = await TaskDetails.findByIdAndDelete(taskId);
  
      if (!deletedTask) {
        return res.status(404).json({ status: 'error', data: 'Task not found' });
      }
  
      // Update the user's tasks field to remove the deleted task
      await User.updateOne(
        { tasks: taskId },
        { $pull: { tasks: taskId } }
      );
  
      // Respond with success status
      res.json({ status: 'ok', data: 'Task deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error', data: error.message });
    }
  });
  
  // ... (other code)
  