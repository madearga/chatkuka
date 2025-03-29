"use client";

export const Overview = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-4 py-8">
      <div className="rounded-xl bg-muted/50 p-6 md:p-8 max-w-xl w-full text-center">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">Welcome to Chat</h2>
        <p className="text-muted-foreground mb-4">
          Send a message to start a conversation. You can ask questions, request assistance, or simply chat.
        </p>
        <p className="text-xs text-muted-foreground">
          Use the buttons at the bottom of the screen to send messages, search the web, or upload files.
        </p>
      </div>
    </div>
  );
};
