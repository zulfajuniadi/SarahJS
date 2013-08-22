<?php include('header.tpl'); $state = (isset($state)) ? $state : ''; ?>
<div class="container">
    <!-- Default Case : Login -->
    <br>
    <br>
    <div class="row">
        <div class="span8 offset2">
            <div class="card">
                <h3 class="card-heading">Login</h3><br>
                <form action="/login" method="post" class="form form-horizontal card-body">
                    <div class="control-group">
                        <label class="control-label" for="email"> Email Address </label>
                        <div class="controls">
                            <input type="email" name="email" id="email" required="required" class="input-xlarge" value ="a@b.c">
                        </div>
                    </div>
                    <div class="control-group">
                        <label class="control-label" for="password"> Password </label>
                        <div class="controls">
                            <input type="password" name="password" id="password" required="required" class="input-xlarge" value ="asdasd">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-primary" type="submit">Login</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<?php include('footer.tpl'); ?>